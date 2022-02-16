# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import hashlib
import re
import struct
from base64 import b64decode, b64encode
from io import BytesIO
from random import randint

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from lxml import etree
from odoo import models
from odoo.tools.xml_utils import _check_with_xsd


class L10nEsTbaiXmlUtils():
    """Utility Methods for Bask Country's TicketBAI XML-related stuff."""

    NS_MAP = {"ds": "http://www.w3.org/2000/09/xmldsig#"}

    @staticmethod
    def _canonicalize_node(node, is_string=False):
        """
        Returns the canonical (C14N 1.1) representation of node, as a string
        Required for computing digests and signatures
        """
        node = etree.fromstring(node) if is_string else node
        return etree.tostring(node, method="c14n", with_comments=False, exclusive=False)

    @staticmethod
    def _cleanup_xml_content(xml_str, indent_level=0, indent=True):
        """
        Cleanups the content of the provided string representation of an XML:
        - Removes comments
        - Fixes indentation (using two spaces)
        - Adds a newline as tail for proper concatenation of elements
        Returns an etree.ElementTree
        """
        parser = etree.XMLParser(compact=True, remove_blank_text=True, remove_comments=True)
        xml_bytes = xml_str.encode("utf-8")
        tree = etree.fromstring(xml_bytes, parser=parser)
        if indent:
            etree.indent(tree, level=indent_level)
            tree.tail = "\n"

        return tree

    @staticmethod
    def _cleanup_xml_signature(xml_sig):
        """
        Cleanups the content of the provided string representation of an XML signature
        In addition, removes all line feeds for the ds:Object element
        Returns an etree.ElementTree
        """
        sig_tree = L10nEsTbaiXmlUtils._cleanup_xml_content(xml_sig, indent=False)
        etree.indent(sig_tree, space="")
        # Iterate over entire ds:Object sub-tree
        for elem in sig_tree.find("ds:Object", namespaces=L10nEsTbaiXmlUtils.NS_MAP).iter():
            if elem.text == "\n":
                elem.text = ""  # optional but keeps the signature object in one line
            elem.tail = ""  # necessary for some reason
        return sig_tree

    @staticmethod
    def _get_uri(uri, reference):
        node = reference.getroottree()
        if uri == "":
            # Empty URI points to whole document (without signature)
            return L10nEsTbaiXmlUtils._canonicalize_node(
                re.sub(r"^[^\n]*<ds:Signature.*<\/ds:Signature>", r"",
                       etree.tostring(node).decode("utf-8"),
                       flags=re.DOTALL | re.MULTILINE),
                is_string=True)

        if uri.startswith("#"):
            query = "//*[@*[local-name() = '{}' ]=$uri]"
            results = node.xpath(query.format("Id"), uri=uri.lstrip("#"))  # case-sensitive 'Id'
            if len(results) == 1:
                return L10nEsTbaiXmlUtils._canonicalize_node(results[0])
            if len(results) > 1:
                raise Exception("Ambiguous reference URI {} resolved to {} nodes".format(
                    uri, len(results)))

        raise Exception('URI "' + uri + '" not found')

    @staticmethod
    def _reference_digests(node):
        for reference in node.findall("ds:Reference", namespaces=L10nEsTbaiXmlUtils.NS_MAP):
            ref_node = L10nEsTbaiXmlUtils._get_uri(reference.get("URI", ""), reference)
            lib = hashlib.new("sha256")
            lib.update(ref_node)
            reference.find("ds:DigestValue", namespaces=L10nEsTbaiXmlUtils.NS_MAP).text = b64encode(lib.digest())

    @staticmethod
    def _fill_signature(node, private_key):
        signed_info_xml = node.find("ds:SignedInfo", namespaces=L10nEsTbaiXmlUtils.NS_MAP)

        signature = private_key.sign(
            L10nEsTbaiXmlUtils._canonicalize_node(signed_info_xml),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        node.find("ds:SignatureValue", namespaces=L10nEsTbaiXmlUtils.NS_MAP).text = L10nEsTbaiXmlUtils._base64_print(b64encode(signature))

    @staticmethod
    def _long_to_bytes(number):
        """
        Converts a long integer to a byte string.
        """
        # convert to byte string
        num_bytes = b""
        while number > 0:
            num_bytes = struct.pack(b">I", number & 0xFFFFFFFF) + num_bytes
            number = number >> 32
        # strip off leading zeros
        for i in range(len(num_bytes)):
            if num_bytes[i] != b"\000"[0]:
                break
        # special case: n == 0
        else:
            num_bytes = b"\000"
            i = 0
        num_bytes = num_bytes[i:]
        return num_bytes

    @staticmethod
    def _base64_print(string):
        """
        Prints a string with line feeds every 64 characters.
        """
        string = str(string, "utf8")
        return "\n".join(
            string[pos: pos + 64]
            for pos in range(0, len(string), 64)
        )

    @staticmethod
    def _validate_format_xsd(xml_bytes, xsd_id, env):
        """
        Checks that the xml file represented by xml_bytes respects the xsd schema with ID xsd_id.
        In case of validation failure, throws back the UserError thrown by _check_with_xsd.
        """
        xsd_attachment = env.ref(xsd_id, False)
        xsd_datas = b64decode(xsd_attachment.datas) if xsd_attachment else None
        with BytesIO(xsd_datas) as xsd:
            _check_with_xsd(
                xml_bytes,
                xsd,
                env  # allows function to find reference to local xsd (for imports, see schemaLocation in xsd)
            )

class L10nEsTbaiMiscUtils(models.AbstractModel):
    _name = 'l10n_es.edi.tbai.misc_util'
    _description = "Utility Methods for Bask Country's TicketBAI miscellaneous stuff. TODO: (re)move"

    def _random_vat(self, force_new=False):
        # Unless force_new is True, only generate new VAT when no chain exists (tests & demo)
        # TODO this condition may be omitted using a noupdate="1" attribute in demo_company.xml
        if not force_new and self.env['res.company'].get_l10n_es_tbai_last_posted_id():
            return self.company_id.vat
        else:
            vat = randint(0, 99999999)
            return "ES" + "{:08}".format(vat) + "TRWAGMYFPDXBNJZSQVHLCKE"[vat % 23]

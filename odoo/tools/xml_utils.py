# -*- coding: utf-8 -*-
"""Utilities for generating, parsing and checking XML/XSD files on top of the lxml.etree module."""

import base64
import collections
import logging
import requests
import zipfile
from io import BytesIO
from lxml import etree
from lxml.etree import XMLSyntaxError

from odoo.exceptions import UserError


_logger = logging.getLogger(__name__)


class odoo_resolver(etree.Resolver):
    """Odoo specific file resolver that can be added to the XML Parser.

    It will search filenames in the ir.attachments
    """

    def __init__(self, env):
        super().__init__()
        self.env = env

    def resolve(self, url, id, context):
        """Search url in ``ir.attachment`` and return the resolved content."""
        attachment = self.env['ir.attachment'].search([('name', '=', url)])
        if attachment:
            return self.resolve_string(base64.b64decode(attachment.datas), context)


def _check_with_xsd(tree_or_str, stream, env=None):
    """Check an XML against an XSD schema.

    This will raise a UserError if the XML file is not valid according to the
    XSD file.
    :param tree_or_str (etree, str): representation of the tree to be checked
    :param stream (io.IOBase, str): the byte stream used to build the XSD schema.
        If env is given, it can also be the name of an attachment in the filestore
    :param env (odoo.api.Environment): If it is given, it enables resolving the
        imports of the schema in the filestore with ir.attachments.
    """
    if not isinstance(tree_or_str, etree._Element):
        tree_or_str = etree.fromstring(tree_or_str)
    parser = etree.XMLParser()
    if env:
        parser.resolvers.add(odoo_resolver(env))
        if isinstance(stream, str) and stream.endswith('.xsd'):
            attachment = env['ir.attachment'].search([('name', '=', stream)])
            if not attachment:
                raise FileNotFoundError()
            stream = BytesIO(base64.b64decode(attachment.datas))
    xsd_schema = etree.XMLSchema(etree.parse(stream, parser=parser))
    try:
        xsd_schema.assertValid(tree_or_str)
    except etree.DocumentInvalid as xml_errors:
        raise UserError('\n'.join(str(e) for e in xml_errors.error_log))


def create_xml_node_chain(first_parent_node, nodes_list, last_node_value=None):
    """Generate a hierarchical chain of nodes.

    Each new node being the child of the previous one based on the tags contained
    in `nodes_list`, under the given node `first_parent_node`.
    :param first_parent_node (etree._Element): parent of the created tree/chain
    :param nodes_list (iterable<str>): tag names to be created
    :param last_node_value (str): if specified, set the last node's text to this value
    :returns (list<etree._Element>): the list of created nodes
    """
    res = []
    current_node = first_parent_node
    for tag in nodes_list:
        current_node = etree.SubElement(current_node, tag)
        res.append(current_node)

    if last_node_value is not None:
        current_node.text = last_node_value
    return res


def create_xml_node(parent_node, node_name, node_value=None):
    """Create a new node.

    :param parent_node (etree._Element): parent of the created node
    :param node_name (str): name of the created node
    :param node_value (str): value of the created node (optional)
    :returns (etree._Element):
    """
    return create_xml_node_chain(parent_node, [node_name], node_value)[0]


def load_xsd_and_validate_xml(env, module_name, url, xmls_to_validate):
    """Validates the provided XML files with associated XSD files loaded from given url.
    The XSD files are fetched from database if previously cached.

    :param odoo.api.Environment env: environment of calling module (odoo.api.Environment)
    :param str module_name: name of calling module (str)
    :param str url: url of XSD file/ZIP archive (str)
    :param dict or list[tuple] xmls_to_validate: is either
        1) a dictionary of XML files, where keys are XSD file names and values are a tuple with the XML name and file
        (i.e. {xsd_file_name: (xml_name, xml_file)})
        The XSD file is the one that will be used to validate the associated XML file (if retrieved from given url)
        (implies that url leads to a ZIP archive)
        2) a list of tuples (xml_name, xml_file). The XML files will be tested against the same XSD (from given url)
        (implies that url leads to an XSD file)
    :rtype: bool
    :returns: True if all XML files validated, False otherwise (feedback provided in _logger.warning)
    """

    def check_xsd_content(xsd_content, xsd_name):
        try:
            return etree.fromstring(xsd_content)
        except XMLSyntaxError:
            _logger.warning("Failed to parse response's content (wrong XML structure) for file with name %s" % xsd_name)
            return

    def fetch_attachment():
        file_name = url.split('/')[-1].replace('.', '_')
        xsd_file_name = 'xsd_cached_%s' % file_name
        fetched_attachment = env['ir.attachment'].search([('name', '=', xsd_file_name)])
        if fetched_attachment:
            _logger.info("Retrieved xsd/zip from database, attachment name: %s" % file_name)
            return fetched_attachment
        else:
            _logger.info("Fetching xsd/zip from given url: %s" % url)
            response = requests.get(url, timeout=10)
            if not response.ok:
                _logger.warning("HTTP error (status code %s) with the given URL: %s", response.status_code, url)
                return

            # Cache XSD/ZIP as attachment for future use
            return env['ir.attachment'].create({
                'res_model': module_name,
                'name': xsd_file_name,
                'raw': response.content,
            })

    def unzip_and_validate(zip_attachment):
        # Unzip
        archive = zipfile.ZipFile(BytesIO(zip_attachment.raw))

        # Save XSD files in a dictionary {xsd_name: xsd_file}
        xsd_dictionary = {}
        for file in archive.namelist():
            if file.endswith('.xsd'):
                try:
                    content = archive.open(file).read()
                    if check_xsd_content(content, file) is None:
                        continue
                    cached_file_name = "xsd_cached_%s" % file
                    xsd_dictionary[cached_file_name] = content
                except KeyError:
                    _logger.warning("Failed to retrieve XSD file with name %s from ZIP archive" % file)

        # Validate every XML file using associated XSD
        all_validated = True
        for xml_name_key in xmls_to_validate:
            xml = xmls_to_validate[xml_name_key]
            xsd = xsd_dictionary.get("xsd_cached_%s" % xml_name_key)
            if xsd is None:
                all_validated = False
                _logger.warning("No XSD file found with name: %s" % xml_name_key)
                continue

            with BytesIO(xsd) as xsd_stream:
                try:
                    _check_with_xsd(xml, xsd_stream)
                except UserError:
                    all_validated = False
                    _logger.warning("The following XML file failed to validate: %s" % xml_name_key)
        return all_validated

    def validate(xsd_attachment):
        # Check XSD for valid structure and validate all XML's with this XSD
        if check_xsd_content(xsd_attachment.raw, xsd_attachment.name) is None:
            return False
        all_validated = True
        for (xml_name, xml_file) in xmls_to_validate:
            with BytesIO(xsd_attachment.raw) as xsd:
                try:
                    _check_with_xsd(xml_file, xsd)
                except UserError:
                    all_validated = False
                    _logger.warning("the following XML file: %s failed to check against the following XSD file : %s" % (xml_name, xsd_attachment.name))
        return all_validated

    # Check for correct parameters (url and xml_to_validate)
    if not url.endswith(('.xsd', '.zip')):
        _logger.warning("The URL needs to lead to an XSD file or a ZIP archive")
        return False
    else:
        if url.endswith('.xsd'):
            is_zip_file = False
            if not isinstance(xmls_to_validate, list):
                _logger.warning("URL's with XSD files require a list of XML's")
                return False
        else:
            is_zip_file = True
            if not isinstance(xmls_to_validate, collections.Mapping):
                _logger.warning("URL's with ZIP archive require a dictionary of XML's")
                return False

    attachment = fetch_attachment()
    if attachment is None:
        return False

    if is_zip_file:
        return unzip_and_validate(attachment)
    else:
        return validate(attachment)


def load_xsd_from_url(env, url, module_name, file_name=None, zip_file_names=None, to_be_cached=False):
    """Load xsd file(s) from given url and potentially cache them as ir.attachment.

    NOTE: This method should just be used in stable (v15) and will be removed in master.
          Its current purpose is just to harmonize the loading of XSD files for already created modules.
          The method load_xsd_and_validate_xml is the one that should/will be used for future modules.

    :param odoo.api.Environment env: environment of calling module (odoo.api.Environment)
    :param str url: url of xsd file/archive (str)
    :param str module_name: name of calling module (str)
    :param str file_name: if provided, gives this name to the cached file, in case of a single xsd file (str)
    :param list[str] zip_file_names: list of file names to be extracted from zip archive. If not provided, extract all .xsd files (list of str)
    :param bool to_be_cached: if True, the raw xsd files will be cached and thus saved as ir.attachment (bool)
    :rtype: list[bytes] or None
    :returns: list of raw xsd files (bytes) or None if error
    """

    def get_response_content():
        response = requests.get(url, timeout=10)
        if not response.ok:
            _logger.warning("HTTP error (status code %s) with the given URL: %s", response.status_code, url)
            return
        return response.content

    def check_xsd_content(xsd_content, xsd_file_name):
        try:
            return etree.fromstring(xsd_content)
        except XMLSyntaxError:
            _logger.warning("Failed to parse response's content (wrong XML structure) for file with name %s" % xsd_file_name)
            return

    def load_xsd():
        fname = file_name or url.split('/')[-1].replace('.', '_')
        xsd_fname = 'xsd_cached_%s_%s' % (module_name, fname)
        attachment = env['ir.attachment'].search([('name', '=', xsd_fname)])
        if attachment:
            return [attachment.raw]
        content = get_response_content()
        if not content:
            return

        if check_xsd_content(content, fname) is None:
            return

        if to_be_cached:
            env['ir.attachment'].create({
                'res_model': module_name,
                'name': xsd_fname,
                'raw': content,
            })
        return [content]

    def load_zip():
        # Extract and parse the archive for xsd files
        content = get_response_content()
        if not content:
            return
        archive = zipfile.ZipFile(BytesIO(content))
        zip_xsd_list = []
        for file_path in archive.namelist():
            # If zip_file_names are provided, file_path needs to match one
            if (not zip_file_names or file_path in zip_file_names) and file_path.endswith('.xsd'):
                file = file_path
                attachment = env['ir.attachment'].search([('name', '=', file)])
                if attachment:
                    zip_xsd_list.append(attachment.raw)
                    continue
                try:
                    content = archive.open(file).read()
                    if check_xsd_content(content, file) is None:
                        continue
                    zip_xsd_list.append(content)
                    if to_be_cached:
                        env['ir.attachment'].create({
                            'res_model': module_name,
                            'name': file,
                            'raw': content,
                        })
                except KeyError:
                    _logger.warning("Failed to retrieve XSD file with name %s from ZIP archive" % file)
        return zip_xsd_list

    if url.lower().endswith('.xsd'):
        xsd_list = load_xsd()
    elif url.lower().endswith('.zip'):
        xsd_list = load_zip()
    else:
        _logger.warning("File should be an XSD file or a ZIP archive")
        return

    return xsd_list

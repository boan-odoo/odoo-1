# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import base64
from datetime import datetime

from odoo.addons.account_edi.tests.common import AccountEdiTestCommon
from odoo.tests import tagged
from odoo.tools import misc
from pytz import timezone


@tagged('post_install_l10n', 'post_install', '-at_install')
class TestEsEdiTbaiCommon(AccountEdiTestCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref='l10n_es.account_chart_template_full', edi_format_ref='l10n_es_edi_tbai.edi_es_tbai'):
        super().setUpClass(chart_template_ref=chart_template_ref, edi_format_ref=edi_format_ref)

        cls.frozen_today = datetime(year=2022, month=1, day=1, hour=0, minute=0, second=0, tzinfo=timezone('utc'))

        # Allow to see the full result of AssertionError.
        cls.maxDiff = None

        # ==== Config ====

        cls.certificate = cls.env['l10n_es_edi.certificate'].create({
            'content': base64.encodebytes(
                misc.file_open("l10n_es_edi_tbai/demo/certificates/sello_entidad_act.p12", 'rb').read()),
            'password': 'IZDesa2021',
        })

        cls.company_data['company'].write({
            'name': 'EUS Company',
            'country_id': cls.env.ref('base.es').id,
            'state_id': cls.env.ref('base.state_es_ss').id,  # TODO test all states (codes in res_company.l10n_es_tbai_tax_agency)
            'l10n_es_tbai_certificate_id': cls.certificate.id,
            'vat': cls.env['l10n_es.edi.tbai.misc_util']._random_vat(force_new=True),  # random VAT (so chain is new)
            'l10n_es_tbai_test_env': True,
            'l10n_es_tbai_tax_agency': 'gipuzkoa',  # TODO test all
        })

        # ==== Business ====

        cls.partner_a.write({
            'name': "&@àÁ$£€èêÈÊöÔÇç¡⅛™³",  # special characters should be escaped appropriately
            'vat': 'BE0477472701',
            'country_id': cls.env.ref('base.be').id,
            'zip': 93071,
        })

        cls.partner_b.write({
            'vat': 'ESF35999705',
        })

        cls.product_t = cls.env["product.product"].create(
            {"name": "Test product"})
        cls.partner_t = cls.env["res.partner"].create({"name": "Test partner", "vat": "ESF35999705"})

    @classmethod
    def _get_tax_by_xml_id(cls, trailing_xml_id):
        """ Helper to retrieve a tax easily.

        :param trailing_xml_id: The trailing tax's xml id.
        :return:                An account.tax record
        """
        return cls.env.ref(f'l10n_es.{cls.env.company.id}_account_tax_template_{trailing_xml_id}')

    @classmethod
    def create_invoice(cls, **kwargs):
        return cls.env['account.move'].with_context(edi_test_mode=True).create({
            'move_type': 'out_invoice',
            'partner_id': cls.partner_a.id,
            'invoice_date': '2022-01-01',
            'date': '2022-01-01',
            **kwargs,
            'invoice_line_ids': [(0, 0, {
                'product_id': cls.product_a.id,
                'price_unit': 1000.0,
                **line_vals,
            }) for line_vals in kwargs.get('invoice_line_ids', [])],
        })

    L10N_ES_TBAI_SAMPLE_XML_POST = """<?xml version='1.0' encoding='UTF-8'?>
<T:TicketBai xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" xmlns:T="urn:ticketbai:emision" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <Cabecera>
    <IDVersionTBAI>1.2</IDVersionTBAI>
  </Cabecera>
  <Sujetos>
    <Emisor>
      <NIF>___ignore___</NIF>
      <ApellidosNombreRazonSocial>EUS Company</ApellidosNombreRazonSocial>
    </Emisor>
    <Destinatarios>
      <IDDestinatario>
        <IDOtro>
          <IDType>02</IDType>
          <ID>BE0477472701</ID>
        </IDOtro>
        <ApellidosNombreRazonSocial>&amp;@&#224;&#193;$&#163;&#8364;&#232;&#234;&#200;&#202;&#246;&#212;&#199;&#231;&#161;&#8539;&#8482;&#179;</ApellidosNombreRazonSocial>
        <CodigoPostal>___ignore___</CodigoPostal>
        <Direccion>___ignore___</Direccion>
      </IDDestinatario>
    </Destinatarios>
    <VariosDestinatarios>N</VariosDestinatarios>
    <EmitidaPorTercerosODestinatario>D</EmitidaPorTercerosODestinatario>
  </Sujetos>
  <Factura>
    <CabeceraFactura>
      <SerieFactura>INVTEST</SerieFactura>
      <NumFactura>01</NumFactura>
      <FechaExpedicionFactura>01-01-2022</FechaExpedicionFactura>
      <HoraExpedicionFactura>___ignore___</HoraExpedicionFactura>
    </CabeceraFactura>
    <DatosFactura>
      <DescripcionFactura>manual</DescripcionFactura>
      <DetallesFactura>
        <IDDetalleFactura>
          <DescripcionDetalle>producta</DescripcionDetalle>
          <Cantidad>5.00</Cantidad>
          <ImporteUnitario>1000.00</ImporteUnitario>
          <Descuento>20.00</Descuento>
          <ImporteTotal>4840.00</ImporteTotal>
        </IDDetalleFactura>
      </DetallesFactura>
      <ImporteTotalFactura>4840.00</ImporteTotalFactura>
      <Claves>
        <IDClave>
          <ClaveRegimenIvaOpTrascendencia>01</ClaveRegimenIvaOpTrascendencia>
        </IDClave>
      </Claves>
    </DatosFactura>
    <TipoDesglose>
      <DesgloseTipoOperacion>
        <Entrega>
          <Sujeta>
            <NoExenta>
              <DetalleNoExenta>
                <TipoNoExenta>S1</TipoNoExenta>
                <DesgloseIVA>
                  <DetalleIVA>
                    <BaseImponible>4000.00</BaseImponible>
                    <TipoImpositivo>21.00</TipoImpositivo>
                    <CuotaImpuesto>840.00</CuotaImpuesto>
                    <OperacionEnRecargoDeEquivalenciaORegimenSimplificado>N</OperacionEnRecargoDeEquivalenciaORegimenSimplificado>
                  </DetalleIVA>
                </DesgloseIVA>
              </DetalleNoExenta>
            </NoExenta>
          </Sujeta>
        </Entrega>
      </DesgloseTipoOperacion>
    </TipoDesglose>
  </Factura>
  <HuellaTBAI>
    <Software>
      <LicenciaTBAI>___ignore___</LicenciaTBAI>
      <EntidadDesarrolladora>
        <NIF>___ignore___</NIF>
      </EntidadDesarrolladora>
      <Nombre>___ignore___</Nombre>
      <Version>___ignore___</Version>
    </Software>
    <NumSerieDispositivo>___ignore___</NumSerieDispositivo>
  </HuellaTBAI>
  <ds:Signature Id="___ignore___">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>___ignore___</ds:DigestValue>
      </ds:Reference>
      <ds:Reference URI="___ignore___">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>___ignore___</ds:DigestValue>
      </ds:Reference>
      <ds:Reference URI="___ignore___">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>___ignore___</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>___ignore___</ds:SignatureValue>
    <ds:KeyInfo Id="___ignore___">
      <ds:X509Data>
        <ds:X509Certificate>___ignore___</ds:X509Certificate>
      </ds:X509Data>
      <ds:KeyValue>
        <ds:RSAKeyValue>
          <ds:Modulus>___ignore___</ds:Modulus>
          <ds:Exponent>AQAB</ds:Exponent>
        </ds:RSAKeyValue>
      </ds:KeyValue>
    </ds:KeyInfo>
    <ds:Object>
      <etsi:QualifyingProperties Target="___ignore___">
        <etsi:SignedProperties Id="___ignore___">
          <etsi:SignedSignatureProperties>
            <etsi:SigningTime>___ignore___</etsi:SigningTime>
            <etsi:SigningCertificateV2>
              <etsi:Cert>
                <etsi:CertDigest>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"/>
                  <ds:DigestValue>___ignore___</ds:DigestValue>
                </etsi:CertDigest>
              </etsi:Cert>
            </etsi:SigningCertificateV2>
            <etsi:SignaturePolicyIdentifier>
              <etsi:SignaturePolicyId>
                <etsi:SigPolicyId>
                  <etsi:Identifier>https://www.gipuzkoa.eus/TicketBAI/signature</etsi:Identifier>
                  <etsi:Description>Pol&#237;tica de Firma TicketBAI 1.0</etsi:Description>
                </etsi:SigPolicyId>
                <etsi:SigPolicyHash>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"/>
                  <ds:DigestValue>___ignore___</ds:DigestValue>
                </etsi:SigPolicyHash>
              </etsi:SignaturePolicyId>
            </etsi:SignaturePolicyIdentifier>
          </etsi:SignedSignatureProperties>
        </etsi:SignedProperties>
      </etsi:QualifyingProperties>
    </ds:Object>
  </ds:Signature>
</T:TicketBai>
""".encode("utf-8")

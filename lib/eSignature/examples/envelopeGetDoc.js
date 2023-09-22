/**
 * @file
 * Example 007: Get a document from an envelope
 * @author DocuSign
 */

const docusign = require("docusign-esign");

/**
 * This function does the work of listing the envelope's recipients
 */
const getDocument = async (args) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId
  // args.documentId
  // args.envelopeDocuments.envelopeId
  // args.envelopeDocuments.documents -- array of {documentId, name, type}

  //ds-snippet-start:eSign7Step2
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;
  //ds-snippet-end:eSign7Step2

  // Step 1. EnvelopeDocuments::get.
  // Exceptions will be caught by the calling function
  //ds-snippet-start:eSign7Step3
  results = await envelopesApi.getDocument(
    args.accountId,
    args.envelopeDocuments.envelopeId,
    args.documentId,
    null
  );
  //ds-snippet-end:eSign7Step3

  let docItem = args.envelopeDocuments.documents.find(
      (item) => item.documentId === args.documentId
    ),
    docName = docItem.name,
    hasPDFsuffix = docName.substr(docName.length - 4).toUpperCase() === ".PDF",
    pdfFile = hasPDFsuffix;
  // Add .pdf if it's a content or summary doc and doesn't already end in .pdf
  if (
    (docItem.type === "content" || docItem.type === "summary") &&
    !hasPDFsuffix
  ) {
    docName += ".pdf";
    pdfFile = true;
  }
  if (docItem.type === 'portfolio') {
    docName += ".pdf";
    pdfFile = true;
  }
  // Add .zip as appropriate
  if (docItem.type === "zip") {
    docName += ".zip";
  }

  // Return the file information
  // See https://stackoverflow.com/a/30625085/64904
  let mimetype;
  if (pdfFile) {
    mimetype = "application/pdf";
  } else if (docItem.type === "zip") {
    mimetype = "application/zip";
  } else {
    mimetype = "application/octet-stream";
  }

  return { mimetype: mimetype, docName: docName, fileBytes: results };
};

module.exports = { getDocument };

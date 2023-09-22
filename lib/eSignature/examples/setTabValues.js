/**
 * @file
 * Example 016: Set optional and locked field values and an envelope custom field value
 * @author DocuSign
 */

const fs = require("fs-extra");
const docusign = require("docusign-esign");

/**
 * This function does the work of creating the envelope and the
 * embedded signing
 * @param {object} args
 */
const setTabValues = async (args) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId
  // args.envelopeArgs.signerEmail
  // args.envelopeArgs.signerName
  // args.envelopeArgs.signerClientId
  // args.envelopeArgs.dsReturnUrl

  //ds-snippet-start:eSign16Step2
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
  //ds-snippet-end:eSign16Step2
    results = null,
    envelopeArgs = args.envelopeArgs;

  // Step 1. Make the envelope request body
  //ds-snippet-start:eSign16Step3
  let envelope = makeEnvelope(envelopeArgs);
  //ds-snippet-end:eSign16Step3

  // Step 2. call Envelopes::create API method
  // Exceptions will be caught by the calling function
  //ds-snippet-start:eSign16Step4
  results = await envelopesApi.createEnvelope(args.accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = results.envelopeId;
  //ds-snippet-end:eSign16Step4
  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);

  // Step 3. create the recipient view, the embedded signing
  //ds-snippet-start:eSign16Step5
  let viewRequest = docusign.RecipientViewRequest.constructFromObject({
    returnUrl: envelopeArgs.dsReturnUrl,
    authenticationMethod: "none",
    email: envelopeArgs.signerEmail,
    userName: envelopeArgs.signerName,
    clientUserId: envelopeArgs.signerClientId,
  });

  // Step 4. Call the CreateRecipientView API
  // Exceptions will be caught by the calling function
  results = await envelopesApi.createRecipientView(args.accountId, envelopeId, {
    recipientViewRequest: viewRequest,
  });
  //ds-snippet-end:eSign16Step5

  return { envelopeId: envelopeId, redirectUrl: results.url };
};

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope:
 * @returns {Envelope} An envelope definition
 * @private
 */
//ds-snippet-start:eSign16Step3
function makeEnvelope(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.signerClientId

  // document 1 (docx) has tags
  // /sn1/ - signature field
  // /salary/ - yearly salary
  // /legal/ - legal name
  // /familiar/ - person's familiar name
  //
  // The envelope has one recipient.
  // recipient 1 - signer
  //
  // The salary is set both as a readable number in the
  // /salary/ text field, and as a pure number in a
  // custom field ('salary') in the envelope.

  // Salary that will be used.

  // read file from a local directory
  // The read could raise an exception if the file is not available!
  let docBytes = fs.readFileSync(args.docFile),
    doc1b64 = Buffer.from(docBytes).toString("base64"),
    // create the document model
    document = docusign.Document.constructFromObject({
      documentBase64: doc1b64,
      name: "Lorem Ipsum", // can be different from actual file name
      fileExtension: "docx",
      documentId: "1",
    }),
    // Create a signer recipient to sign the document, identified by name and email
    // We set the clientUserId to enable embedded signing for the recipient
    signer = docusign.Signer.constructFromObject({
      email: args.signerEmail,
      name: args.signerName,
      clientUserId: args.signerClientId,
      recipientId: 1,
    }),
    // Create signHere field (also known as tabs) on the document,
    signHere = docusign.SignHere.constructFromObject({
      anchorString: "/sn1/",
      anchorUnits: "pixels",
      anchorYOffset: "10",
      anchorXOffset: "20",
    }),
    // Create the legal and familiar text fields.
    // Recipients can update these values if they wish to.
    textLegal = docusign.Text.constructFromObject({
      anchorString: "/legal/",
      anchorUnits: "pixels",
      anchorYOffset: "-9",
      anchorXOffset: "5",
      font: "helvetica",
      fontSize: "size11",
      bold: "true",
      value: args.signerName,
      locked: "false",
      tabId: "legal_name",
      tabLabel: "Legal name",
    }),
    textFamiliar = docusign.Text.constructFromObject({
      anchorString: "/familiar/",
      anchorUnits: "pixels",
      anchorYOffset: "-9",
      anchorXOffset: "5",
      font: "helvetica",
      fontSize: "size11",
      bold: "true",
      value: args.signerName,
      locked: "false",
      tabId: "familiar_name",
      tabLabel: "Familiar name",
    }),
    // Create the salary field. It should be human readable, so
    // add a comma before the thousands number, a currency indicator, etc.
    localePolicyTab = docusign.LocalePolicyTab.constructFromObject({
      cultureName: "en-US",
      currencyCode: "usd",
      currencyPositiveFormat: "csym_1_comma_234_comma_567_period_89",
      currencyNegativeFormat: "minus_csym_1_comma_234_comma_567_period_89",
      useLongCurrencyFormat: "true"
    }),
    numericalSalary = docusign.Numerical.constructFromObject({
      pageNumber: "1",
      documentId: "1",
      xPosition: "210",
      yPosition: "235",
      height: "20",
      width: "70",
      font: "helvetica",
      fontSize: "size11",
      bold: "true",
      tabId: "salary",
      tabLabel: "Salary",
      validationType: "Currency",
      numericalValue: "123000",
      localePolicy: localePolicyTab
    });
  // Add the tabs model (including the sign_here tab) to the signer.
  // The Tabs object wants arrays of the different field/tab types
  signer.tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere],
    textTabs: [textLegal, textFamiliar],
    numericalTabs: [numericalSalary],
  });

  // Create an envelope custom field to save the "real" (numeric)
  // version of the salary
  salaryCustomField = docusign.TextCustomField.constructFromObject({
    name: "salary",
    required: "false",
    show: "true", // Yes, include in the CoC
    value: "123000",
  });
  customFields = docusign.CustomFields.constructFromObject({
    textCustomFields: [salaryCustomField],
  });

  // Next, create the top level envelope definition and populate it.
  envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
    emailSubject: "Please sign this salary document",
    documents: [document],
    // The Recipients object wants arrays for each recipient type
    recipients: docusign.Recipients.constructFromObject({ signers: [signer] }),
    status: "sent", // requests that the envelope be created and sent.
    customFields: customFields,
  });

  return envelopeDefinition;
}
//ds-snippet-end:eSign16Step3

module.exports = { setTabValues, makeEnvelope };

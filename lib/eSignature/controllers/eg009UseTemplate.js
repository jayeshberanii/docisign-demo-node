/**
 * @file
 * Example 009: Send envelope using a template
 * @author DocuSign
 */

const path = require('path');
const { sendEnvelopeFromTemplate } = require('../examples/useTemplate');
const validator = require('validator');
const { getExampleByNumber } = require("../../manifestService");
const { formatString, API_TYPES } = require('../../utils.js');
const dsConfig = require('../../../config/index.js').config;

const eg009UseTemplate = exports;
const exampleNumber = 9;
const eg = `eg00${exampleNumber}`; // This example reference.
const api = API_TYPES.ESIGNATURE;
const mustAuthenticate = '/ds/mustAuthenticate';
const minimumBufferMin = 3;

/**
 * Send envelope with a template
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg009UseTemplate.createController = async (req, res) => {
    // Step 1. Check the token
    // At this point we should have a good token. But we
    // double-check here to enable a better UX to the user.
    const isTokenOK = req.dsAuth.checkToken(minimumBufferMin);
    if (!isTokenOK) {
        req.flash('info', 'Sorry, you need to re-authenticate.');
        // Save the current operation so it will be resumed after authentication
        req.dsAuth.setEg(req, eg);
        return res.redirect(mustAuthenticate);
    }

    const example = getExampleByNumber(res.locals.manifest, exampleNumber, api);
    if (!req.session.templateId) {
        res.render('pages/examples/eg009UseTemplate', {
            eg: eg, csrfToken: req.csrfToken(),
            example: example,
            templateOk: req.session.templateId,
            sourceFile: path.basename(__filename),
            sourceUrl: dsConfig.githubExampleUrl + 'eSignature/' + path.basename(__filename),
            documentation: dsConfig.documentation + eg,
            showDoc: dsConfig.documentation
        });
    }

    // Step 2. Call the worker method
    const { body } = req;
    // Additional data validation might also be appropriate
    const envelopeArgs  = {
        templateId: req.session.templateId,
        signerEmail: validator.escape(body.signerEmail),
        signerName: validator.escape(body.signerName),
        ccEmail: validator.escape(body.ccEmail),
        ccName: validator.escape(body.ccName)
    };
    const args = {
        accessToken: req.user.accessToken,
        basePath: req.session.basePath,
        accountId: req.session.accountId,
        envelopeArgs: envelopeArgs
    };
    let results = null;

    try {
        results = await sendEnvelopeFromTemplate(args);
    } catch (error) {
        const errorBody = error && error.response && error.response.body;
        // we can pull the DocuSign error code and message from the response body
        const errorCode = errorBody && errorBody.errorCode;
        const errorMessage = errorBody && errorBody.message;
        // In production, may want to provide customized error messages and
        // remediation advice to the user.
        res.render('pages/error', {err: error, errorCode, errorMessage});
    }

    if (results) {
        req.session.envelopeId = results.envelopeId; // Save for use by other examples
        // which need an envelopeId
        const example = getExampleByNumber(res.locals.manifest, exampleNumber, api);
        res.render('pages/example_done', {
            title: example.ExampleName,
            message: formatString(example.ResultsPageText, results.envelopeId)
        });
    }
}

/**
 * Form page for this application
 */
eg009UseTemplate.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    const isTokenOK = req.dsAuth.checkToken();
    if (!isTokenOK) {
        // Save the current operation so it will be resumed after authentication
        req.dsAuth.setEg(req, eg);
        return res.redirect(mustAuthenticate);
    }

    const example = getExampleByNumber(res.locals.manifest, exampleNumber, api);
    const sourceFile = (path.basename(__filename))[5].toLowerCase() + (path.basename(__filename)).substr(6);
    res.render('pages/examples/eg009UseTemplate', {
        eg: eg, csrfToken: req.csrfToken(),
        example: example,
        templateOk: req.session.templateId,
        sourceFile: sourceFile,
        sourceUrl: dsConfig.githubExampleUrl + 'eSignature/examples/' + sourceFile,
        documentation: dsConfig.documentation + eg,
        showDoc: dsConfig.documentation
    });
}

/**
 * @file
 * Example 027: Deleting a permission profile
 * @author DocuSign
 */

const docusign = require("docusign-esign");

/**
 * This function does the work of deleting the permission
 */
const deletePermission = async (args) => {
  // Construct your API headers
  //ds-snippet-start:eSign27Step2
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let accountsApi = new docusign.AccountsApi(dsApiClient);
  //ds-snippet-end:eSign27Step2

  //ds-snippet-start:eSign27Step3
  await accountsApi.deletePermissionProfile(args.accountId, args.profileId);
  //ds-snippet-end:eSign27Step3
};

/**
 * Form page for this application
 */
const getPermissions = async (args) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);

  let accountApi = new docusign.AccountsApi(dsApiClient);
  let profiles = await accountApi.listPermissions(args.accountId);
  let permissionProfiles = profiles.permissionProfiles;

  return permissionProfiles;
};


module.exports = { deletePermission, getPermissions };

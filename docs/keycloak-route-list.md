# Keycloak — Full Route List

Complete reference of every HTTP route Keycloak exposes, compiled for comparison
against this service's own realm/role/client/user/permission API design.

Two distinct API surfaces are covered:

1. **Admin REST API** — `/admin/realms/...` — the management API used by the Keycloak
   Admin Console and any external tooling to configure realms, clients, roles, users, etc.
   Extracted directly from Keycloak's official OpenAPI spec — **401 operations across
   265 unique paths**, grouped below by the 22 resource tags Keycloak itself uses.
2. **Realm protocol (OIDC) endpoints** — `/realms/{realm}/...` — the runtime
   authentication/token endpoints every client and end-user actually hits during login,
   token exchange, logout, etc. Not part of the Admin REST API.

Sources:
- Admin REST API: official OpenAPI spec at `https://www.keycloak.org/docs-api/latest/rest-api/openapi.json`
- OIDC endpoints: Keycloak docs source `docs/guides/securing-apps/partials/oidc/available-endpoints.adoc`
  (github.com/keycloak/keycloak)

---

## 1. Admin REST API

Base path: `/admin/realms/{realm}/...` (realm-scoped) — plus a handful of
root-level admin endpoints not nested under a specific realm (realm listing/creation,
server info). Every path below is relative to the Keycloak server's admin base URL.

### Resource groups

- [Attack Detection](#attack-detection) — 3 operations
- [Authentication Management](#authentication-management) — 39 operations
- [Client Attribute Certificate](#client-attribute-certificate) — 7 operations
- [Client Initial Access](#client-initial-access) — 3 operations
- [Client Registration Policy](#client-registration-policy) — 1 operations
- [Client Role Mappings](#client-role-mappings) — 10 operations
- [Client Scopes](#client-scopes) — 10 operations
- [Clients](#clients) — 34 operations
- [Component](#component) — 6 operations
- [Groups](#groups) — 11 operations
- [Identity Providers](#identity-providers) — 17 operations
- [Key](#key) — 1 operations
- [Organizations](#organizations) — 36 operations
- [Protocol Mappers](#protocol-mappers) — 21 operations
- [Realms Admin](#realms-admin) — 45 operations
- [Role Mapper](#role-mapper) — 12 operations
- [Roles](#roles) — 28 operations
- [Roles (by ID)](#roles-by-id) — 10 operations
- [Scope Mappings](#scope-mappings) — 33 operations
- [Authorization Services (Fine-Grained)](#authorization-services-fine-grained) — 31 operations
- [Users](#users) — 34 operations
- [Workflows](#workflows) — 9 operations

---

### Attack Detection

| Method | Path | Description |
|---|---|---|
| DELETE | `/admin/realms/{realm}/attack-detection/brute-force/users` | Clear any user login failures for all users This can release temporary disabled users |
| GET | `/admin/realms/{realm}/attack-detection/brute-force/users/{userId}` | Get status of a username in brute force detection |
| DELETE | `/admin/realms/{realm}/attack-detection/brute-force/users/{userId}` | Clear any user login failures for the user This can release temporary disabled user |

### Authentication Management

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/authentication/authenticator-providers` | Get authenticator providers Returns a stream of authenticator providers. |
| GET | `/admin/realms/{realm}/authentication/client-authenticator-providers` | Get client authenticator providers Returns a stream of client authenticator providers. |
| POST | `/admin/realms/{realm}/authentication/config` | Create new authenticator configuration |
| GET | `/admin/realms/{realm}/authentication/config-description/{providerId}` | Get authenticator provider's configuration description |
| GET | `/admin/realms/{realm}/authentication/config/{id}` | Get authenticator configuration |
| PUT | `/admin/realms/{realm}/authentication/config/{id}` | Update authenticator configuration |
| DELETE | `/admin/realms/{realm}/authentication/config/{id}` | Delete authenticator configuration |
| POST | `/admin/realms/{realm}/authentication/executions` | Add new authentication execution |
| GET | `/admin/realms/{realm}/authentication/executions/{executionId}` | Get Single Execution |
| DELETE | `/admin/realms/{realm}/authentication/executions/{executionId}` | Delete execution |
| POST | `/admin/realms/{realm}/authentication/executions/{executionId}/config` | Update execution with new configuration |
| GET | `/admin/realms/{realm}/authentication/executions/{executionId}/config/{id}` | Get execution's configuration |
| POST | `/admin/realms/{realm}/authentication/executions/{executionId}/lower-priority` | Lower execution's priority |
| POST | `/admin/realms/{realm}/authentication/executions/{executionId}/raise-priority` | Raise execution's priority |
| GET | `/admin/realms/{realm}/authentication/flows` | Get authentication flows Returns a stream of authentication flows. |
| POST | `/admin/realms/{realm}/authentication/flows` | Create a new authentication flow |
| POST | `/admin/realms/{realm}/authentication/flows/{flowAlias}/copy` | Copy existing authentication flow under a new name The new name is given as 'newName' attribute of the passed JSON object |
| GET | `/admin/realms/{realm}/authentication/flows/{flowAlias}/executions` | Get authentication executions for a flow |
| PUT | `/admin/realms/{realm}/authentication/flows/{flowAlias}/executions` | Update authentication executions of a Flow |
| POST | `/admin/realms/{realm}/authentication/flows/{flowAlias}/executions/execution` | Add new authentication execution to a flow |
| POST | `/admin/realms/{realm}/authentication/flows/{flowAlias}/executions/flow` | Add new flow with new execution to existing flow |
| GET | `/admin/realms/{realm}/authentication/flows/{id}` | Get authentication flow for id |
| PUT | `/admin/realms/{realm}/authentication/flows/{id}` | Update an authentication flow |
| DELETE | `/admin/realms/{realm}/authentication/flows/{id}` | Delete an authentication flow |
| GET | `/admin/realms/{realm}/authentication/form-action-providers` | Get form action providers Returns a stream of form action providers. |
| GET | `/admin/realms/{realm}/authentication/form-providers` | Get form providers Returns a stream of form providers. |
| GET | `/admin/realms/{realm}/authentication/per-client-config-description` | Get configuration descriptions for all clients |
| POST | `/admin/realms/{realm}/authentication/register-required-action` | Register a new required actions |
| GET | `/admin/realms/{realm}/authentication/required-actions` | Get required actions Returns a stream of required actions. |
| GET | `/admin/realms/{realm}/authentication/required-actions/{alias}` | Get required action for alias |
| PUT | `/admin/realms/{realm}/authentication/required-actions/{alias}` | Update required action |
| DELETE | `/admin/realms/{realm}/authentication/required-actions/{alias}` | Delete required action |
| GET | `/admin/realms/{realm}/authentication/required-actions/{alias}/config` | Get RequiredAction configuration |
| PUT | `/admin/realms/{realm}/authentication/required-actions/{alias}/config` | Update RequiredAction configuration |
| DELETE | `/admin/realms/{realm}/authentication/required-actions/{alias}/config` | Delete RequiredAction configuration |
| GET | `/admin/realms/{realm}/authentication/required-actions/{alias}/config-description` | Get RequiredAction provider configuration description |
| POST | `/admin/realms/{realm}/authentication/required-actions/{alias}/lower-priority` | Lower required action's priority |
| POST | `/admin/realms/{realm}/authentication/required-actions/{alias}/raise-priority` | Raise required action's priority |
| GET | `/admin/realms/{realm}/authentication/unregistered-required-actions` | Get unregistered required actions Returns a stream of unregistered required actions. |

### Client Attribute Certificate

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}` | Get key info |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}/download` | Get a keystore file for the client, containing private key and public certificate |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}/generate` | Generate a new certificate with new key pair |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}/generate-and-download` | Generate a new keypair and certificate, and get the private key file

Generates a keypair and certificate and serves the private key in a specified keystore format.
Only generated public certificate is saved in Keycloak DB - the private key is not. |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}/upload` | Upload certificate and eventually private key |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/certificates/{attr}/upload-certificate` | Upload only certificate, not private key |
| POST | `/admin/realms/{realm}/identity-provider/upload-certificate` | Uploads a certificate, prepares the jwks or public key associated, and returns the certificate representation. |

### Client Initial Access

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/clients-initial-access` |  |
| POST | `/admin/realms/{realm}/clients-initial-access` | Create a new initial access token. |
| DELETE | `/admin/realms/{realm}/clients-initial-access/{id}` |  |

### Client Registration Policy

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/client-registration-policy/providers` | Base path for retrieve providers with the configProperties properly filled |

### Client Role Mappings

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/clients/{client-id}` | Get client-level role mappings for the user or group, and the app |
| POST | `/admin/realms/{realm}/groups/{group-id}/role-mappings/clients/{client-id}` | Add client-level roles to the user or group role mapping |
| DELETE | `/admin/realms/{realm}/groups/{group-id}/role-mappings/clients/{client-id}` | Delete client-level roles from user or group role mapping |
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/clients/{client-id}/available` | Get available client-level roles that can be mapped to the user or group |
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/clients/{client-id}/composite` | Get effective client-level role mappings This recurses any composite roles |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/clients/{client-id}` | Get client-level role mappings for the user or group, and the app |
| POST | `/admin/realms/{realm}/users/{user-id}/role-mappings/clients/{client-id}` | Add client-level roles to the user or group role mapping |
| DELETE | `/admin/realms/{realm}/users/{user-id}/role-mappings/clients/{client-id}` | Delete client-level roles from user or group role mapping |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/clients/{client-id}/available` | Get available client-level roles that can be mapped to the user or group |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/clients/{client-id}/composite` | Get effective client-level role mappings This recurses any composite roles |

### Client Scopes

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/client-scopes` | Get client scopes belonging to the realm Returns a list of client scopes belonging to the realm |
| POST | `/admin/realms/{realm}/client-scopes` | Create a new client scope Client Scope’s name must be unique! |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}` | Get representation of the client scope |
| PUT | `/admin/realms/{realm}/client-scopes/{client-scope-id}` | Update the client scope |
| DELETE | `/admin/realms/{realm}/client-scopes/{client-scope-id}` | Delete the client scope |
| GET | `/admin/realms/{realm}/client-templates` | Get client scopes belonging to the realm Returns a list of client scopes belonging to the realm |
| POST | `/admin/realms/{realm}/client-templates` | Create a new client scope Client Scope’s name must be unique! |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}` | Get representation of the client scope |
| PUT | `/admin/realms/{realm}/client-templates/{client-scope-id}` | Update the client scope |
| DELETE | `/admin/realms/{realm}/client-templates/{client-scope-id}` | Delete the client scope |

### Clients

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/clients` | Get clients belonging to the realm. |
| POST | `/admin/realms/{realm}/clients` | Create a new client Client’s client_id must be unique! |
| GET | `/admin/realms/{realm}/clients/{client-uuid}` | Get representation of the client |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}` | Update the client |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}` | Delete the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/client-secret` | Get the client secret |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/client-secret` | Generate a new secret for the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/client-secret/rotated` | Get the rotated client secret |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/client-secret/rotated` | Invalidate the rotated secret for the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/default-client-scopes` | Get default client scopes.  Only name and ids are returned. |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/default-client-scopes/{clientScopeId}` |  |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/default-client-scopes/{clientScopeId}` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/generate-example-access-token` | Create JSON with payload of example access token |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/generate-example-id-token` | Create JSON with payload of example id token |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/generate-example-userinfo` | Create JSON with payload of example user info |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/protocol-mappers` | Return list of all protocol mappers, which will be used when generating tokens issued for particular client. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/scope-mappings/{roleContainerId}/granted` | Get effective scope mapping of all roles of particular role container, which this client is defacto allowed to have in the accessToken issued for him. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/evaluate-scopes/scope-mappings/{roleContainerId}/not-granted` | Get roles, which this client doesn't have scope for and can't have them in the accessToken issued for him. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/installation/providers/{providerId}` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/nodes` | Register a cluster node with the client Manually register cluster node to this client - usually it’s not needed to call this directly as adapter should handle by sending registration request to Keycloak |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/nodes/{node}` | Unregister a cluster node from the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/offline-session-count` | Get application offline session count Returns a number of offline user sessions associated with this client { "count": number } |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/offline-sessions` | Get offline sessions for client Returns a list of offline user sessions associated with this client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/optional-client-scopes` | Get optional client scopes.  Only name and ids are returned. |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/optional-client-scopes/{clientScopeId}` |  |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/optional-client-scopes/{clientScopeId}` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/push-revocation` | Push the client's revocation policy to its admin URL If the client has an admin URL, push revocation policy to it. |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/registration-access-token` | Generate a new registration access token for the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/service-account-user` | Get a user dedicated to the service account |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/session-count` | Get application session count Returns a number of user sessions associated with this client { "count": number } |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/test-nodes-available` | Test if registered cluster nodes are available Tests availability by sending 'ping' request to all cluster nodes. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/user-sessions` | Get user sessions for client Returns a list of user sessions associated with this client |

### Component

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/components` |  |
| POST | `/admin/realms/{realm}/components` |  |
| GET | `/admin/realms/{realm}/components/{id}` |  |
| PUT | `/admin/realms/{realm}/components/{id}` |  |
| DELETE | `/admin/realms/{realm}/components/{id}` |  |
| GET | `/admin/realms/{realm}/components/{id}/sub-component-types` | List of subcomponent types that are available to configure for a particular parent component. |

### Groups

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/groups` | Get group hierarchy.  Only `name` and `id` are returned.  `subGroups` are only returned when using the `search` or `q` parameter. If none of these parameters is provided, the top-level groups are returned without `subGroups` being filled. |
| POST | `/admin/realms/{realm}/groups` | create or add a top level realm groupSet or create child. |
| GET | `/admin/realms/{realm}/groups/count` | Returns the groups counts. |
| GET | `/admin/realms/{realm}/groups/{group-id}` |  |
| PUT | `/admin/realms/{realm}/groups/{group-id}` | Update group, ignores subgroups. |
| DELETE | `/admin/realms/{realm}/groups/{group-id}` |  |
| GET | `/admin/realms/{realm}/groups/{group-id}/children` | Return a paginated list of subgroups that have a parent group corresponding to the group on the URL |
| POST | `/admin/realms/{realm}/groups/{group-id}/children` | Set or create child. |
| GET | `/admin/realms/{realm}/groups/{group-id}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/groups/{group-id}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| GET | `/admin/realms/{realm}/groups/{group-id}/members` | Get users Returns a stream of users, filtered according to query parameters |

### Identity Providers

| Method | Path | Description |
|---|---|---|
| POST | `/admin/realms/{realm}/identity-provider/import-config` | Import identity provider from JSON body |
| GET | `/admin/realms/{realm}/identity-provider/instances` | List identity providers |
| POST | `/admin/realms/{realm}/identity-provider/instances` | Create a new identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}` | Get the identity provider |
| PUT | `/admin/realms/{realm}/identity-provider/instances/{alias}` | Update the identity provider |
| DELETE | `/admin/realms/{realm}/identity-provider/instances/{alias}` | Delete the identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/export` | Export public broker configuration for identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/identity-provider/instances/{alias}/management/permissions` | Return object stating whether client Authorization permissions have been initialized or not and a reference |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/mapper-types` | Get mapper types for identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/mappers` | Get mappers for identity provider |
| POST | `/admin/realms/{realm}/identity-provider/instances/{alias}/mappers` | Add a mapper to identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/mappers/{id}` | Get mapper by id for the identity provider |
| PUT | `/admin/realms/{realm}/identity-provider/instances/{alias}/mappers/{id}` | Update a mapper for the identity provider |
| DELETE | `/admin/realms/{realm}/identity-provider/instances/{alias}/mappers/{id}` | Delete a mapper for the identity provider |
| GET | `/admin/realms/{realm}/identity-provider/instances/{alias}/reload-keys` | Reaload keys for the identity provider if the provider supports it, "true" is returned if reload was performed, "false" if not. |
| GET | `/admin/realms/{realm}/identity-provider/providers/{provider_id}` | Get the identity provider factory for that provider id |

### Key

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/keys` |  |

### Organizations

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/organizations` | Returns a paginated list of organizations filtered according to the specified parameters |
| POST | `/admin/realms/{realm}/organizations` | Creates a new organization |
| GET | `/admin/realms/{realm}/organizations/count` | Returns the organizations counts. |
| GET | `/admin/realms/{realm}/organizations/members/{member-id}/organizations` | Returns the organizations associated with the user that has the specified id |
| GET | `/admin/realms/{realm}/organizations/{org-id}` | Returns the organization representation |
| PUT | `/admin/realms/{realm}/organizations/{org-id}` | Updates the organization |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}` | Deletes the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/groups` | Get organization groups |
| POST | `/admin/realms/{realm}/organizations/{org-id}/groups` | Creates a new top-level group or moves an existing group to top-level |
| GET | `/admin/realms/{realm}/organizations/{org-id}/groups/group-by-path/{path}` | Get organization group by path |
| GET | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}` | Get organization group representation |
| PUT | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}` | Update organization group |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}` | Delete the organization group |
| GET | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}/children` | Get subgroups of this organization group |
| POST | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}/children` | Create or move a subgroup |
| GET | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}/members` | Get members of this organization group |
| PUT | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}/members/{userId}` | Add a user to this organization group |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}/groups/{group-id}/members/{userId}` | Remove a user from this organization group |
| GET | `/admin/realms/{realm}/organizations/{org-id}/identity-providers` | Returns all identity providers associated with the organization |
| POST | `/admin/realms/{realm}/organizations/{org-id}/identity-providers` | Adds the identity provider with the specified id to the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/identity-providers/{alias}` | Returns the identity provider associated with the organization that has the specified alias |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}/identity-providers/{alias}` | Removes the identity provider with the specified alias from the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/identity-providers/{alias}/groups` | Returns organization groups for the identity provider |
| GET | `/admin/realms/{realm}/organizations/{org-id}/invitations` | Get invitations for the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/invitations/{id}` | Get invitation by ID |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}/invitations/{id}` | Delete an invitation |
| POST | `/admin/realms/{realm}/organizations/{org-id}/invitations/{id}/resend` | Resend an invitation |
| GET | `/admin/realms/{realm}/organizations/{org-id}/members` | Returns a paginated list of organization members filtered according to the specified parameters |
| POST | `/admin/realms/{realm}/organizations/{org-id}/members` | Adds the user with the specified id as a member of the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/members/count` | Returns number of members in the organization. |
| POST | `/admin/realms/{realm}/organizations/{org-id}/members/invite-existing-user` | Invites an existing user to the organization, using the specified user id |
| POST | `/admin/realms/{realm}/organizations/{org-id}/members/invite-user` | Invites an existing user or sends a registration link to a new user, based on the provided e-mail address. |
| GET | `/admin/realms/{realm}/organizations/{org-id}/members/{member-id}` | Returns the member of the organization with the specified id |
| DELETE | `/admin/realms/{realm}/organizations/{org-id}/members/{member-id}` | Removes the user with the specified id from the organization |
| GET | `/admin/realms/{realm}/organizations/{org-id}/members/{member-id}/groups` | Returns the organization group memberships for a member with the specified id |
| GET | `/admin/realms/{realm}/organizations/{org-id}/members/{member-id}/organizations` | Returns the organizations associated with the user that has the specified id |

### Protocol Mappers

| Method | Path | Description |
|---|---|---|
| POST | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/add-models` | Create multiple mappers |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/models` | Get mappers |
| POST | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/models` | Create a mapper |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/models/{id}` | Get mapper by id |
| PUT | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/models/{id}` | Update the mapper |
| DELETE | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/models/{id}` | Delete the mapper |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/protocol-mappers/protocol/{protocol}` | Get mappers by name for a specific protocol |
| POST | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/add-models` | Create multiple mappers |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/models` | Get mappers |
| POST | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/models` | Create a mapper |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/models/{id}` | Get mapper by id |
| PUT | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/models/{id}` | Update the mapper |
| DELETE | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/models/{id}` | Delete the mapper |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/protocol-mappers/protocol/{protocol}` | Get mappers by name for a specific protocol |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/add-models` | Create multiple mappers |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/models` | Get mappers |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/models` | Create a mapper |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/models/{id}` | Get mapper by id |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/models/{id}` | Update the mapper |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/models/{id}` | Delete the mapper |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/protocol-mappers/protocol/{protocol}` | Get mappers by name for a specific protocol |

### Realms Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms` | Get accessible realms Returns a list of accessible realms. The list is filtered based on what realms the caller is allowed to view. |
| POST | `/admin/realms` | Import a realm. Imports a realm from a full representation of that realm. |
| GET | `/admin/realms/{realm}` | Get the top-level representation of the realm It will not include nested information like User and Client representations. |
| PUT | `/admin/realms/{realm}` | Update the top-level information of the realm Any user, roles or client information in the representation will be ignored. |
| DELETE | `/admin/realms/{realm}` | Delete the realm |
| GET | `/admin/realms/{realm}/admin-events` | Get admin events Returns all admin events, or filters events based on URL query parameters listed here |
| DELETE | `/admin/realms/{realm}/admin-events` | Delete all admin events |
| POST | `/admin/realms/{realm}/client-description-converter` | Base path for importing clients under this realm. |
| GET | `/admin/realms/{realm}/client-policies/policies` |  |
| PUT | `/admin/realms/{realm}/client-policies/policies` |  |
| GET | `/admin/realms/{realm}/client-policies/profiles` |  |
| PUT | `/admin/realms/{realm}/client-policies/profiles` |  |
| GET | `/admin/realms/{realm}/client-session-stats` | Get client session stats Returns a JSON map. |
| GET | `/admin/realms/{realm}/client-types` | List all client types available in the current realm |
| PUT | `/admin/realms/{realm}/client-types` | Update a client type |
| GET | `/admin/realms/{realm}/credential-registrators` |  |
| GET | `/admin/realms/{realm}/default-default-client-scopes` | Get realm default client scopes. Only name and ids are returned. |
| PUT | `/admin/realms/{realm}/default-default-client-scopes/{clientScopeId}` |  |
| DELETE | `/admin/realms/{realm}/default-default-client-scopes/{clientScopeId}` |  |
| GET | `/admin/realms/{realm}/default-groups` | Get group hierarchy.  Only name and ids are returned. |
| PUT | `/admin/realms/{realm}/default-groups/{groupId}` |  |
| DELETE | `/admin/realms/{realm}/default-groups/{groupId}` |  |
| GET | `/admin/realms/{realm}/default-optional-client-scopes` | Get realm optional client scopes. Only name and ids are returned. |
| PUT | `/admin/realms/{realm}/default-optional-client-scopes/{clientScopeId}` |  |
| DELETE | `/admin/realms/{realm}/default-optional-client-scopes/{clientScopeId}` |  |
| GET | `/admin/realms/{realm}/events` | Get events Returns all events, or filters them based on URL query parameters listed here |
| DELETE | `/admin/realms/{realm}/events` | Delete all events |
| GET | `/admin/realms/{realm}/events/config` | Get the events provider configuration Returns JSON object with events provider configuration |
| PUT | `/admin/realms/{realm}/events/config` |  |
| GET | `/admin/realms/{realm}/group-by-path/{path}` |  |
| GET | `/admin/realms/{realm}/localization` |  |
| GET | `/admin/realms/{realm}/localization/{locale}` |  |
| POST | `/admin/realms/{realm}/localization/{locale}` | Import localization from uploaded JSON file |
| DELETE | `/admin/realms/{realm}/localization/{locale}` |  |
| GET | `/admin/realms/{realm}/localization/{locale}/{key}` |  |
| PUT | `/admin/realms/{realm}/localization/{locale}/{key}` |  |
| DELETE | `/admin/realms/{realm}/localization/{locale}/{key}` |  |
| POST | `/admin/realms/{realm}/logout-all` | Removes all user sessions. |
| POST | `/admin/realms/{realm}/partial-export` | Partial export of existing realm into a JSON file. |
| POST | `/admin/realms/{realm}/partialImport` | Partial import from a JSON file to an existing realm. |
| POST | `/admin/realms/{realm}/push-revocation` | Push the realm's revocation policy to any client that has an admin url associated with it. |
| DELETE | `/admin/realms/{realm}/sessions/{session}` | Remove a specific user session. |
| POST | `/admin/realms/{realm}/testSMTPConnection` | Test SMTP connection with current logged in user |
| GET | `/admin/realms/{realm}/users-management-permissions` |  |
| PUT | `/admin/realms/{realm}/users-management-permissions` |  |

### Role Mapper

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings` | Get role mappings |
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/realm` | Get realm-level role mappings |
| POST | `/admin/realms/{realm}/groups/{group-id}/role-mappings/realm` | Add realm-level role mappings to the user |
| DELETE | `/admin/realms/{realm}/groups/{group-id}/role-mappings/realm` | Delete realm-level role mappings |
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/realm/available` | Get realm-level roles that can be mapped |
| GET | `/admin/realms/{realm}/groups/{group-id}/role-mappings/realm/composite` | Get effective realm-level role mappings This will recurse all composite roles to get the result. |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings` | Get role mappings |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/realm` | Get realm-level role mappings |
| POST | `/admin/realms/{realm}/users/{user-id}/role-mappings/realm` | Add realm-level role mappings to the user |
| DELETE | `/admin/realms/{realm}/users/{user-id}/role-mappings/realm` | Delete realm-level role mappings |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/realm/available` | Get realm-level roles that can be mapped |
| GET | `/admin/realms/{realm}/users/{user-id}/role-mappings/realm/composite` | Get effective realm-level role mappings This will recurse all composite roles to get the result. |

### Roles

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles` | Get all roles for the realm or client |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/roles` | Create a new role for the realm or client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}` | Get a role by name |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}` | Update a role by name |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}` | Delete a role by name |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/composites` | Get composites of the role |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/composites` | Add a composite to the role |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/composites` | Remove roles from the role's composite |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/composites/clients/{targetClientUuid}` | Get client-level roles for the client that are in the role's composite |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/composites/realm` | Get realm-level roles of the role's composite |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/groups` | Returns a stream of groups that have the specified role name |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/roles/{role-name}/users` | Returns a stream of users that have the specified role name. |
| GET | `/admin/realms/{realm}/roles` | Get all roles for the realm or client |
| POST | `/admin/realms/{realm}/roles` | Create a new role for the realm or client |
| GET | `/admin/realms/{realm}/roles/{role-name}` | Get a role by name |
| PUT | `/admin/realms/{realm}/roles/{role-name}` | Update a role by name |
| DELETE | `/admin/realms/{realm}/roles/{role-name}` | Delete a role by name |
| GET | `/admin/realms/{realm}/roles/{role-name}/composites` | Get composites of the role |
| POST | `/admin/realms/{realm}/roles/{role-name}/composites` | Add a composite to the role |
| DELETE | `/admin/realms/{realm}/roles/{role-name}/composites` | Remove roles from the role's composite |
| GET | `/admin/realms/{realm}/roles/{role-name}/composites/clients/{targetClientUuid}` | Get client-level roles for the client that are in the role's composite |
| GET | `/admin/realms/{realm}/roles/{role-name}/composites/realm` | Get realm-level roles of the role's composite |
| GET | `/admin/realms/{realm}/roles/{role-name}/groups` | Returns a stream of groups that have the specified role name |
| GET | `/admin/realms/{realm}/roles/{role-name}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/roles/{role-name}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |
| GET | `/admin/realms/{realm}/roles/{role-name}/users` | Returns a stream of users that have the specified role name. |

### Roles (by ID)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/roles-by-id/{role-id}` | Get a specific role's representation |
| PUT | `/admin/realms/{realm}/roles-by-id/{role-id}` | Update the role |
| DELETE | `/admin/realms/{realm}/roles-by-id/{role-id}` | Delete the role |
| GET | `/admin/realms/{realm}/roles-by-id/{role-id}/composites` | Get role's children Returns a set of role's children provided the role is a composite. |
| POST | `/admin/realms/{realm}/roles-by-id/{role-id}/composites` | Make the role a composite role by associating some child roles |
| DELETE | `/admin/realms/{realm}/roles-by-id/{role-id}/composites` | Remove a set of roles from the role's composite |
| GET | `/admin/realms/{realm}/roles-by-id/{role-id}/composites/clients/{clientUuid}` | Get client-level roles for the client that are in the role's composite |
| GET | `/admin/realms/{realm}/roles-by-id/{role-id}/composites/realm` | Get realm-level roles that are in the role's composite |
| GET | `/admin/realms/{realm}/roles-by-id/{role-id}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |
| PUT | `/admin/realms/{realm}/roles-by-id/{role-id}/management/permissions` | Return object stating whether role Authorization permissions have been initialized or not and a reference |

### Scope Mappings

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings` | Get all scope mappings for the client |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/clients/{client}` | Get the roles associated with a client's scope Returns roles for the client. |
| POST | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/clients/{client}` | Add client-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/clients/{client}` | Remove client-level roles from the client's scope. |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/clients/{client}/available` | The available client-level roles Returns the roles for the client that can be associated with the client's scope |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/clients/{client}/composite` | Get effective client roles Returns the roles for the client that are associated with the client's scope. |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/realm` | Get realm-level roles associated with the client's scope |
| POST | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/realm` | Add a set of realm-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/realm` | Remove a set of realm-level roles from the client's scope |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/realm/available` | Get realm-level roles that are available to attach to this client's scope |
| GET | `/admin/realms/{realm}/client-scopes/{client-scope-id}/scope-mappings/realm/composite` | Get effective realm-level roles associated with the client’s scope What this does is recurse any composite roles associated with the client’s scope and adds the roles to this lists. |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings` | Get all scope mappings for the client |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/clients/{client}` | Get the roles associated with a client's scope Returns roles for the client. |
| POST | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/clients/{client}` | Add client-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/clients/{client}` | Remove client-level roles from the client's scope. |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/clients/{client}/available` | The available client-level roles Returns the roles for the client that can be associated with the client's scope |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/clients/{client}/composite` | Get effective client roles Returns the roles for the client that are associated with the client's scope. |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/realm` | Get realm-level roles associated with the client's scope |
| POST | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/realm` | Add a set of realm-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/realm` | Remove a set of realm-level roles from the client's scope |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/realm/available` | Get realm-level roles that are available to attach to this client's scope |
| GET | `/admin/realms/{realm}/client-templates/{client-scope-id}/scope-mappings/realm/composite` | Get effective realm-level roles associated with the client’s scope What this does is recurse any composite roles associated with the client’s scope and adds the roles to this lists. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings` | Get all scope mappings for the client |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/clients/{client}` | Get the roles associated with a client's scope Returns roles for the client. |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/clients/{client}` | Add client-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/clients/{client}` | Remove client-level roles from the client's scope. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/clients/{client}/available` | The available client-level roles Returns the roles for the client that can be associated with the client's scope |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/clients/{client}/composite` | Get effective client roles Returns the roles for the client that are associated with the client's scope. |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/realm` | Get realm-level roles associated with the client's scope |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/realm` | Add a set of realm-level roles to the client's scope |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/realm` | Remove a set of realm-level roles from the client's scope |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/realm/available` | Get realm-level roles that are available to attach to this client's scope |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/scope-mappings/realm/composite` | Get effective realm-level roles associated with the client’s scope What this does is recurse any composite roles associated with the client’s scope and adds the roles to this lists. |

### Authorization Services (Fine-Grained)

*(Left untagged in Keycloak's own OpenAPI spec — relabeled here for readability;*
*these manage a client's resources/scopes/policies/permissions as a UMA resource server.)*

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server` |  |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/import` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/permission` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/permission` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/permission/evaluate` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/permission/providers` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/permission/search` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/policy` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/policy` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/policy/evaluate` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/policy/providers` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/policy/search` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/search` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}` |  |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}` |  |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}/attributes` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}/permissions` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/resource/{resource-id}/scopes` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope` |  |
| POST | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/search` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/{scope-id}` |  |
| PUT | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/{scope-id}` |  |
| DELETE | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/{scope-id}` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/{scope-id}/permissions` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/scope/{scope-id}/resources` |  |
| GET | `/admin/realms/{realm}/clients/{client-uuid}/authz/resource-server/settings` |  |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/users` | Get users Returns a stream of users, filtered according to query parameters. |
| POST | `/admin/realms/{realm}/users` | Create a new user Username must be unique. |
| GET | `/admin/realms/{realm}/users/count` | Returns the number of users that match the given criteria. |
| GET | `/admin/realms/{realm}/users/profile` |  |
| PUT | `/admin/realms/{realm}/users/profile` |  |
| GET | `/admin/realms/{realm}/users/profile/metadata` |  |
| GET | `/admin/realms/{realm}/users/{user-id}` | Get representation of the user |
| PUT | `/admin/realms/{realm}/users/{user-id}` | Update the user |
| DELETE | `/admin/realms/{realm}/users/{user-id}` | Delete the user |
| GET | `/admin/realms/{realm}/users/{user-id}/configured-user-storage-credential-types` | Return credential types, which are provided by the user storage where user is stored. |
| GET | `/admin/realms/{realm}/users/{user-id}/consents` | Get consents granted by the user |
| DELETE | `/admin/realms/{realm}/users/{user-id}/consents/{client}` | Revoke consent and offline tokens for particular client from user |
| GET | `/admin/realms/{realm}/users/{user-id}/credentials` |  |
| DELETE | `/admin/realms/{realm}/users/{user-id}/credentials/{credentialId}` | Remove a credential for a user |
| POST | `/admin/realms/{realm}/users/{user-id}/credentials/{credentialId}/moveAfter/{newPreviousCredentialId}` | Move a credential to a position behind another credential |
| POST | `/admin/realms/{realm}/users/{user-id}/credentials/{credentialId}/moveToFirst` | Move a credential to a first position in the credentials list of the user |
| PUT | `/admin/realms/{realm}/users/{user-id}/credentials/{credentialId}/userLabel` | Update a credential label for a user |
| PUT | `/admin/realms/{realm}/users/{user-id}/disable-credential-types` | Disable all credentials for a user of a specific type |
| PUT | `/admin/realms/{realm}/users/{user-id}/execute-actions-email` | Send an email to the user with a link they can click to execute particular actions. |
| GET | `/admin/realms/{realm}/users/{user-id}/federated-identity` | Get social logins associated with the user |
| POST | `/admin/realms/{realm}/users/{user-id}/federated-identity/{provider}` | Add a social login provider to the user |
| DELETE | `/admin/realms/{realm}/users/{user-id}/federated-identity/{provider}` | Remove a social login provider from user |
| GET | `/admin/realms/{realm}/users/{user-id}/groups` |  |
| GET | `/admin/realms/{realm}/users/{user-id}/groups/count` |  |
| PUT | `/admin/realms/{realm}/users/{user-id}/groups/{groupId}` |  |
| DELETE | `/admin/realms/{realm}/users/{user-id}/groups/{groupId}` |  |
| POST | `/admin/realms/{realm}/users/{user-id}/impersonation` | Impersonate the user |
| POST | `/admin/realms/{realm}/users/{user-id}/logout` | Remove all user sessions associated with the user Also send notification to all clients that have an admin URL to invalidate the sessions for the particular user. |
| GET | `/admin/realms/{realm}/users/{user-id}/offline-sessions/{clientUuid}` | Get offline sessions associated with the user and client |
| PUT | `/admin/realms/{realm}/users/{user-id}/reset-password` | Set up a new password for the user. |
| PUT | `/admin/realms/{realm}/users/{user-id}/reset-password-email` | Send an email to the user with a link they can click to reset their password. |
| PUT | `/admin/realms/{realm}/users/{user-id}/send-verify-email` | Send an email-verification email to the user An email contains a link the user can click to verify their email address. |
| GET | `/admin/realms/{realm}/users/{user-id}/sessions` | Get sessions associated with the user |
| GET | `/admin/realms/{realm}/users/{user-id}/unmanagedAttributes` |  |

### Workflows

| Method | Path | Description |
|---|---|---|
| GET | `/admin/realms/{realm}/workflows` | List workflows |
| POST | `/admin/realms/{realm}/workflows` | Create workflow |
| POST | `/admin/realms/{realm}/workflows/migrate` | Migrate scheduled resources from one step to another |
| GET | `/admin/realms/{realm}/workflows/scheduled/{resource-id}` | List scheduled workflows for resource |
| GET | `/admin/realms/{realm}/workflows/{id}` | Get workflow |
| PUT | `/admin/realms/{realm}/workflows/{id}` | Update workflow |
| DELETE | `/admin/realms/{realm}/workflows/{id}` | Delete workflow |
| POST | `/admin/realms/{realm}/workflows/{id}/activate/{type}/{resourceId}` | Activate workflow for resource |
| POST | `/admin/realms/{realm}/workflows/{id}/deactivate/{type}/{resourceId}` | Deactivate workflow for resource |

---

## 2. Realm protocol (OIDC) endpoints

Every one of these is scoped per realm — replace `{realm-name}` with the actual realm.
Unlike the Admin REST API, these are the endpoints applications and end-users interact
with directly (login redirects, token requests, logout, JWKS, etc.).

| Method | Path | Description |
|---|---|---|
| GET | `/realms/{realm-name}/.well-known/openid-configuration` | OIDC discovery document — lists every other endpoint below plus supported scopes, claims, and signing algorithms |
| GET | `/realms/{realm-name}/protocol/openid-connect/auth` | Authorization endpoint — starts end-user authentication via browser redirect |
| POST | `/realms/{realm-name}/protocol/openid-connect/token` | Token endpoint — exchange an auth code / credentials / refresh token for tokens |
| GET | `/realms/{realm-name}/protocol/openid-connect/userinfo` | Userinfo endpoint — standard claims about the authenticated user (bearer-token protected) |
| GET/POST | `/realms/{realm-name}/protocol/openid-connect/logout` | Logout endpoint — logs out the authenticated user (RP-initiated or legacy direct-invoke logout) |
| GET | `/realms/{realm-name}/protocol/openid-connect/certs` | Certificate/JWKS endpoint — realm's public keys as JSON Web Keys, for verifying tokens |
| POST | `/realms/{realm-name}/protocol/openid-connect/token/introspect` | Token introspection endpoint — validate/inspect an access or refresh token (confidential clients only) |
| POST | `/realms/{realm-name}/protocol/openid-connect/revoke` | Token revocation endpoint — revoke a refresh or access token |
| POST | `/realms/{realm-name}/protocol/openid-connect/auth/device` | Device Authorization endpoint — obtain a device code + user code (OAuth2 Device Authorization Grant) |
| POST | `/realms/{realm-name}/protocol/openid-connect/ext/ciba/auth` | Backchannel Authentication endpoint — obtain an auth_req_id (CIBA flow, confidential clients only) |
| POST | `/realms/{realm-name}/clients-registrations/openid-connect` | Dynamic Client Registration endpoint — register OIDC clients at runtime |

---

## Notes / scope

- **Not included**: the SAML protocol endpoints (`/realms/{realm}/protocol/saml`), the
  self-service Account REST API (`/realms/{realm}/account/...`), and the Admin Console's own
  frontend routes (these are UI pages, not a REST API). Ask if any of these should be added.
- The Admin REST API section above is a mechanical, complete extraction of the official
  OpenAPI spec — every operation Keycloak documents is listed, with no manual curation or
  omission.

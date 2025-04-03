# TheGiveHubApi.DefaultApi

All URIs are relative to *https://api.thegivehub.com/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**authLoginPost**](DefaultApi.md#authLoginPost) | **POST** /auth/login | Authenticate user
[**campaignsCampaignIdGet**](DefaultApi.md#campaignsCampaignIdGet) | **GET** /campaigns/{campaignId} | Get campaign details
[**campaignsCampaignIdMilestonesPost**](DefaultApi.md#campaignsCampaignIdMilestonesPost) | **POST** /campaigns/{campaignId}/milestones | Add milestone to campaign
[**campaignsGet**](DefaultApi.md#campaignsGet) | **GET** /campaigns | List campaigns
[**campaignsPost**](DefaultApi.md#campaignsPost) | **POST** /campaigns | Create a new campaign
[**donationsPost**](DefaultApi.md#donationsPost) | **POST** /donations | Create a donation
[**impactMetricsCampaignIdPost**](DefaultApi.md#impactMetricsCampaignIdPost) | **POST** /impact/metrics/{campaignId} | Add impact metrics



## authLoginPost

> AuthLoginPost200Response authLoginPost(authLoginPostRequest)

Authenticate user

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
ApiKeyAuth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//ApiKeyAuth.apiKeyPrefix = 'Token';

let apiInstance = new TheGiveHubApi.DefaultApi();
let authLoginPostRequest = new TheGiveHubApi.AuthLoginPostRequest(); // AuthLoginPostRequest | 
apiInstance.authLoginPost(authLoginPostRequest, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **authLoginPostRequest** | [**AuthLoginPostRequest**](AuthLoginPostRequest.md)|  | 

### Return type

[**AuthLoginPost200Response**](AuthLoginPost200Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## campaignsCampaignIdGet

> Campaign campaignsCampaignIdGet(campaignId)

Get campaign details

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
ApiKeyAuth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//ApiKeyAuth.apiKeyPrefix = 'Token';

let apiInstance = new TheGiveHubApi.DefaultApi();
let campaignId = "campaignId_example"; // String | 
apiInstance.campaignsCampaignIdGet(campaignId, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **campaignId** | **String**|  | 

### Return type

[**Campaign**](Campaign.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## campaignsCampaignIdMilestonesPost

> campaignsCampaignIdMilestonesPost(campaignId, milestone)

Add milestone to campaign

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure Bearer (JWT) access token for authorization: BearerAuth
let BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = "YOUR ACCESS TOKEN"

let apiInstance = new TheGiveHubApi.DefaultApi();
let campaignId = "campaignId_example"; // String | 
let milestone = new TheGiveHubApi.Milestone(); // Milestone | 
apiInstance.campaignsCampaignIdMilestonesPost(campaignId, milestone, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully.');
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **campaignId** | **String**|  | 
 **milestone** | [**Milestone**](Milestone.md)|  | 

### Return type

null (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined


## campaignsGet

> [Campaign] campaignsGet(opts)

List campaigns

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
ApiKeyAuth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//ApiKeyAuth.apiKeyPrefix = 'Token';

let apiInstance = new TheGiveHubApi.DefaultApi();
let opts = {
  'category': "category_example", // String | 
  'status': "status_example", // String | 
  'page': 56, // Number | 
  'limit': 56 // Number | 
};
apiInstance.campaignsGet(opts, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **category** | **String**|  | [optional] 
 **status** | **String**|  | [optional] 
 **page** | **Number**|  | [optional] 
 **limit** | **Number**|  | [optional] 

### Return type

[**[Campaign]**](Campaign.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## campaignsPost

> Campaign campaignsPost(campaign)

Create a new campaign

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure Bearer (JWT) access token for authorization: BearerAuth
let BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = "YOUR ACCESS TOKEN"

let apiInstance = new TheGiveHubApi.DefaultApi();
let campaign = new TheGiveHubApi.Campaign(); // Campaign | 
apiInstance.campaignsPost(campaign, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **campaign** | [**Campaign**](Campaign.md)|  | 

### Return type

[**Campaign**](Campaign.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## donationsPost

> Donation donationsPost(donation)

Create a donation

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure Bearer (JWT) access token for authorization: BearerAuth
let BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = "YOUR ACCESS TOKEN"

let apiInstance = new TheGiveHubApi.DefaultApi();
let donation = new TheGiveHubApi.Donation(); // Donation | 
apiInstance.donationsPost(donation, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **donation** | [**Donation**](Donation.md)|  | 

### Return type

[**Donation**](Donation.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## impactMetricsCampaignIdPost

> impactMetricsCampaignIdPost(campaignId, impactMetric)

Add impact metrics

### Example

```javascript
import TheGiveHubApi from 'the_give_hub_api';
let defaultClient = TheGiveHubApi.ApiClient.instance;
// Configure Bearer (JWT) access token for authorization: BearerAuth
let BearerAuth = defaultClient.authentications['BearerAuth'];
BearerAuth.accessToken = "YOUR ACCESS TOKEN"

let apiInstance = new TheGiveHubApi.DefaultApi();
let campaignId = "campaignId_example"; // String | 
let impactMetric = [new TheGiveHubApi.ImpactMetric()]; // [ImpactMetric] | 
apiInstance.impactMetricsCampaignIdPost(campaignId, impactMetric, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully.');
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **campaignId** | **String**|  | 
 **impactMetric** | [**[ImpactMetric]**](ImpactMetric.md)|  | 

### Return type

null (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined


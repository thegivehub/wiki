# TheGiveHubApi.Campaign

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | [optional] 
**title** | **String** |  | 
**description** | **String** |  | 
**targetAmount** | **Number** |  | 
**currentAmount** | **Number** |  | [optional] 
**category** | **String** |  | 
**status** | **String** |  | [optional] 
**location** | [**CampaignLocation**](CampaignLocation.md) |  | [optional] 
**milestones** | [**[Milestone]**](Milestone.md) |  | [optional] 
**creator** | [**User**](User.md) |  | [optional] 
**created** | **Date** |  | [optional] 
**updated** | **Date** |  | [optional] 



## Enum: CategoryEnum


* `education` (value: `"education"`)

* `water` (value: `"water"`)

* `health` (value: `"health"`)

* `agriculture` (value: `"agriculture"`)

* `infrastructure` (value: `"infrastructure"`)





## Enum: StatusEnum


* `draft` (value: `"draft"`)

* `active` (value: `"active"`)

* `funded` (value: `"funded"`)

* `completed` (value: `"completed"`)

* `cancelled` (value: `"cancelled"`)





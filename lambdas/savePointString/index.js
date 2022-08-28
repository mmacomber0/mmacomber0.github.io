// Configuring the AWS SDK
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-1'});

exports.handler = /*async*/ (event, context, callback) => {
    var ddb = new AWS.DynamoDB({region: 'us-west-1', apiVersion: '2012-08-10'});
    var requestParams = {
        Item: {
            "Name": {
                S: event.key
            },
            "PointString" : {
                S: event.pointString
            }
        },
        TableName: "TravelPlot",
        ConditionExpression:"attribute_not_exists(PointString) AND attribute_not_exists(SavedKeys)"
    };
    var results = {
        "error":"",
    };
    // console.log(event.key);
    // console.log(event.pointString);
    ddb.putItem(requestParams).promise().then(
        function(data) {
            console.info("successfully called putItem");
            //secondary update, the AvailablePlots string set
            requestParams = {
                ExpressionAttributeNames: {
                 "#K": "SavedKeys"
                }, 
                ExpressionAttributeValues: {
                 ":k": {
                   SS: [event.key]
                 }
                }, 
                Key: {
                    "Name": {
                        S: "AvailablePlots"
                    }
                },
                TableName: "TravelPlot",
                UpdateExpression: "ADD #K :k"
            };
            ddb.updateItem(requestParams).promise().then(
                function(data) {
                    console.info("successfully called updateItem");
                    callback(null,results);
                },
                function() {
                    console.error("Database updateItem error.");
                    results.error = "Database updateItem error.";
                    callback(null,results);
                }
            );
        },
        function(err) {
            console.error("Database putItem error.");
            console.error(err);
            results.error = "Database putItem error.";
            callback(null,results);
        }
    );
    
    
};

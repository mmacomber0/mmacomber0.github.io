// Configuring the AWS SDK
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-1'});

exports.handler = /*async*/ (event, context, callback) => {
    // console.info("start of method");
    var ddb = new AWS.DynamoDB({region: 'us-west-1', apiVersion: '2012-08-10'});
    // console.info("1");
    var requestParams = {
        Key: {
            "Name": {
                S: "AvailablePlots"
            }
        },
        TableName: "TravelPlot"
    };
    // console.info("2");
    var results = {
        "error":"",
        "availablePlots":[]
    };
    // console.info("3");
    ddb.getItem(requestParams).promise().then(
        function(data) {
            console.info("successfully called getItem");
            results.availablePlots = data.Item.SavedKeys;
            callback(null,results);
        },
        function() {
            console.error("Database read error.");
            results.error = "Database read error.";
            callback(null,results);
        }
    );
    //console.info("4");
};

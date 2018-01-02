"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamDescription = {
    StreamDescription: {
        StreamName: 'splunk-phxstage',
        StreamARN: 'arn:aws:kinesis:eu-west-1:937688626168:stream/splunk-phxstage',
        StreamStatus: 'ACTIVE',
        Shards: [],
        HasMoreShards: false,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '2017-09-18T23:19:26.000Z',
        EnhancedMonitoring: [],
        EncryptionType: 'NONE',
    },
};
exports.cloudWatchLogGroupsDescribeResponse = {
    logGroups: [
        {
            logGroupName: '/aws/lambda/instrumentation-gateway-pu-queue-process',
            creationTime: 1504217911320,
            metricFilterCount: 0,
            arn: 'arn:aws:logs:eu-west-1:937688626168:log-group:/aws/lambda/instrumentation-gateway-pu-queue-process:*',
            storedBytes: 0,
        },
    ],
};
exports.describeSubscriptionFilterResponse = {
    subscriptionFilters: [{
            filterName: 'cwlfilter-storage-v2-pu-dockCheck',
            logGroupName: '/aws/lambda/storage-v2-pu-dockCheck',
            filterPattern: '',
            destinationArn: 'arn:aws:kinesis:eu-west-1:937688626168:stream/splunk-phxstage',
            roleArn: 'arn:aws:iam::937688626168:role/CWLtoKinesisRole',
            distribution: 'ByLogStream',
            creationTime: 1504658802825,
        }],
};
exports.getAllCloudWatchLogGroupsResponse = [
    {
        logGroupName: '/aws/lambda/instrumentation-gateway-pu-queue-process',
        creationTime: 1504217911320,
        metricFilterCount: 0,
        arn: 'arn:aws:logs:eu-west-1:937688626168:log-group:/aws/lambda/instrumentation-gateway-pu-queue-process:*',
        storedBytes: 0,
    },
    {
        logGroupName: '/aws/lambda/storage-v2-pu-dockCheck',
        creationTime: 1504221696803,
        metricFilterCount: 0,
        arn: 'arn:aws:logs:eu-west-1:937688626168:log-group:/aws/lambda/storage-v2-pu-dockCheck:*',
        storedBytes: 0,
    },
];
exports.iAmGetRoleResponse = {
    ResponseMetadata: {
        RequestId: '616fbb77-92a9-11e7-817b-ddc7b055e934',
    },
    Role: {
        Path: '/',
        RoleName: 'CWLtoKinesisRole',
        RoleId: 'AROAINMSTNDX7QYOR3FLM',
        Arn: 'arn:aws:iam::937688626168:role/CWLtoKinesisRole',
        CreateDate: '2017 - 08 - 31T02: 04:33.000Z',
        AssumeRolePolicyDocument: '%7B%22Version%22%3A%222008-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Principal%' +
            '22%3A%7B%22Service%22%3A%22logs.eu-west-1.amazonaws.com%22%7D%2C%22Action%22%3A%22sts%3AAssumeRole%22%7D%' +
            '5D%7D',
    },
};

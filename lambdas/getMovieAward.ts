import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        console.log("Event: ", event);
        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
        const awardBody = parameters?.awardBody;

        if (!movieId || !awardBody) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Missing movie Id or awardBody" }),
            };
        }

        const commandOutput = await queryDynamoDB(movieId, awardBody);
        console.log("GetCommand response: ", commandOutput);

        if (!commandOutput.Items) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "No information found for this movie and award" }),
            };
        }
        

        const body = {
            data: commandOutput.Items,
        };

        // Return Response
        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(body),
        };
    } catch (error: any) {
        console.log(JSON.stringify(error));
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error }),
        };
    }
};

function createDynamoDBDocumentClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

async function queryDynamoDB(movieId: number, awardBody: string): Promise<any> {

    const commandInput: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "movieId = :m AND awardBody = :a",
        ExpressionAttributeValues: {
            ":m": movieId,
            ":a": awardBody,
        },
    };

    return await ddbDocClient.send(new QueryCommand(commandInput));
}


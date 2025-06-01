import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class Gltf2UsdzStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda function
    const converter = new lambda.DockerImageFunction(this, 'Converter', {
      code: lambda.DockerImageCode.fromImageAsset('.'),
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      ephemeralStorageSize: cdk.Size.mebibytes(512),
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ConverterApi');

    api.root.addMethod('POST', new apigateway.LambdaIntegration(converter));
  }
} 
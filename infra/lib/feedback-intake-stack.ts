import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class FeedbackIntakeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The in-memory store lives inside one execution container, so records are
    // lost on recycle and concurrent containers cannot see each other's. First
    // thing to replace with DynamoDB behind the existing Store interface.
    //
    // NodejsFunction rather than Function: esbuild bundles the dependencies at synth time.
    const apiFunction = new nodejs.NodejsFunction(this, 'ApiFunction', {
      entry: path.join(__dirname, '..', '..', 'api', 'src', 'lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),

      // ANTHROPIC_API_KEY belongs in Secrets Manager, which needs a secret plus
      // an IAM grant — past the two resources this exercise is scoped to.
      environment: {},
    });

    // Function URL rather than API Gateway: three routes that validate their own
    // input with Zod. API Gateway earns its place at a custom domain, WAF, or
    // several Lambdas behind one hostname.
    const apiUrl = apiFunction.addFunctionUrl({
      // Unauthenticated, matching the brief. The first line to change in
      // production — to AWS_IAM, or API Gateway with an authorizer.
      authType: lambda.FunctionUrlAuthType.NONE,

      // Deployed, the dashboard and the API sit on different domains, so every
      // request is cross-origin; locally the Vite proxy makes them same-origin.
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
        allowedHeaders: ['content-type'],
      },
    });

    // No CloudFront, so the site is HTTP-only with no CDN caching. That buys
    // nothing functionally here and is the honest cost of leaving it out.
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Nothing here uploads the built frontend — that is a deploy step
    // (`aws s3 sync app/dist s3://<bucket>`). BucketDeployment would fold it in
    // at the cost of a helper Lambda and its role.

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiUrl.url,
      description: 'Base URL of the API. The dashboard needs this at build time.',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'Public URL of the dashboard.',
    });
  }
}

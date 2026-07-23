import {
    Html,
    Head,
    Font,
    Preview,
    Heading,
    Row,
    Section,
    Text,
    Button,
  } from '@react-email/components';
  
  interface VerificationEmailProps {
    name: string;
    verificationUrl: string;
  }
  
  export default function VerificationEmail({
    name,
    verificationUrl,
  }: VerificationEmailProps) {
    return (
      <Html lang="en" dir="ltr">
        <Head>
          <title>Verify your email</title>
          <Font
            fontFamily="Roboto"
            fallbackFontFamily="Verdana"
            webFont={{
              url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
              format: 'woff2',
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>
        <Preview>Verify your email to finish setting up FlowBoard</Preview>
        <Section>
          <Row>
            <Heading as="h2">Hello {name},</Heading>
          </Row>
          <Row>
            <Text>
              Thanks for signing up for FlowBoard. Click the button below to
              verify your email address and activate your account.
            </Text>
          </Row>
          <Row>
            <Button
              href={verificationUrl}
              style={{
                background: '#f97316',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Verify email
            </Button>
          </Row>
          <Row>
            <Text>
              This link will expire in 1 hour. If you did not create a FlowBoard
              account, you can safely ignore this email.
            </Text>
          </Row>
        </Section>
      </Html>
    );
  }
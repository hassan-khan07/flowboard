import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Button,
} from "@react-email/components";

interface InviteEmailProps {
  workspaceName: string;
  role: string;
  inviteUrl: string;
}

export default function InviteEmail({
  workspaceName,
  role,
  inviteUrl,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {workspaceName}</Preview>
      <Body>
        <Container>
          <Text>
            You've been invited to join <strong>{workspaceName}</strong> as{" "}
            <strong>{role}</strong> on FlowBoard.
          </Text>
          <Button href={inviteUrl}>Accept Invite</Button>
          <Text>This invite link expires in 7 days.</Text>
        </Container>
      </Body>
    </Html>
  );
}

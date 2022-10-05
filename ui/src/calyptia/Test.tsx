import { Button, Stack, Typography } from '@mui/material';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { useState } from 'react';

export function Test() {
  const ddClient = createDockerDesktopClient();
  const [version, setVersion] = useState<string>('');

  async function runCalyptiaInfo() {
    await ddClient.extension.host.cli.exec("calyptia", ["--version"], {
      stream: {
        onOutput(data): void {
            setVersion(data.stdout);
        },
        onError(error: any): void {
          console.error(error);
        },
        onClose(exitCode: number): void {
          console.log("onClose with exit code " + exitCode);
        },
      },
    });
  }

  return (
    <Stack
      display="flex"
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Button variant="contained" onClick={runCalyptiaInfo}>
        Get Calyptia CLI Info
      </Button>

      <div>
        <Typography>Calyptia CLI: {version}</Typography>
      </div>
    </Stack>
  );
}

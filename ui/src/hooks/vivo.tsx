import { createDockerDesktopClient } from "@docker/extension-api-client"
import { useState, useEffect } from 'react'

function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

const dd = createDockerDesktopClient()

type VivoPorts = {
  ui: number
  http: number
  forward: number
  vivo: number
  'fluent-bit': number
}

function getPorts(jsonStr: string): VivoPorts {
  const rv: VivoPorts = {
    ui: 0,
    http: 0,
    forward: 0,
    vivo: 0,
    'fluent-bit': 0
  }

  try {
    const parsed = JSON.parse(jsonStr);
    for (const item of parsed) {
      if (Object.hasOwn(rv, item.name)) {
        rv[item.name] = item.nodePort ?? 0
      }
    }
  } catch (err) {
    console.warn('failed to parse vivo ports', err)
  }

  return rv;
}

async function getVivoPorts(): Promise<VivoPorts> {
  while (true) {
    try {
      // Get the NodePort value for the HTTP port of the service
      const output = await dd.extension.host.cli.exec("kubectl", [
        "get",
        "service/calyptia-vivo",
        "--output=jsonpath='{.spec.ports}'",
        "--context", "docker-desktop",
      ])
      if (output.stderr !== "") {
        console.warn('failed to get kubernetes port:', output.stderr)
        await sleep(5000)
        continue
      }
      return getPorts(output.stdout)
    } catch (err: any) {
      console.error('error invoking desktop extension api:', err)
      await sleep(10000)
      continue
    }
  }
}

export function useVivoPorts() {
  const [uiPort, setUiPort] = useState(0);
  const [httpInputPort, setHttpInputPort] = useState(0);
  const [forwardInputPort, setForwardInputPort] = useState(0);
  const [fluentBitMetricsPort, setFluentBitMetricsPort] = useState(0);
  const [vivoExporterPort, setVivoExporterPort] = useState(0);

  useEffect(() => {
    function fetch() {
      getVivoPorts().then(p => {
        setUiPort(p.ui);
        setHttpInputPort(p.http);
        setForwardInputPort(p.forward);
        setFluentBitMetricsPort(p["fluent-bit"]);
        setVivoExporterPort(p.vivo);
      });
    }

    fetch();
    const timer = setInterval(fetch, 10000);

    return () => {
      clearInterval(timer);
    }
  });

  return {
    uiPort, httpInputPort, forwardInputPort, fluentBitMetricsPort, vivoExporterPort
  }
}

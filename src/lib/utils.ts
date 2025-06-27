import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEmulatorDomains() {
  // This environment variable value contains the full domain URL and never a localhost value.
  // This domain looks something like: 8080-firebase-studio-174474.cluster-krbdp4txefbbsv3zfyg3a4xp6y.cloudworkstations.dev
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST!;
  const firestoreDomain = firestoreHost.includes("http")
    ? (() => {
        const url = new URL(firestoreHost);
        return { domain: url.hostname, port: +url.port };
      })()
    : { domain: firestoreHost, port: 443 };

  // This environment variable value contains the full domain URL and never a localhost value.
  // This domain looks something like: 9099-firebase-studio-174474.cluster-krbdp4txefbbsv3zfyg3a4xp6y.cloudworkstations.dev
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!;
  const authDomain = authHost.includes("http")
    ? (() => {
        const url = new URL(authHost);
        return { domain: url.hostname, port: +url.port };
      })()
    : { domain: `https://${authHost}`, port: 443 };

  return { firestoreDomain, authDomain };
}


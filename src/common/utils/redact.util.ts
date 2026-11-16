const R = "[REDACTED]";

const sensitiveKeys = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "authorization",
  "cookie",
];

export const redactSensitive = (output: any): any => {
  if (Array.isArray(output)) {
    return output.map((item) => redactSensitive(item));
  }
  if (typeof output !== "object" || output === null) {
    return output;
  }
  const res = { ...output };
  Object.keys(res).forEach((key) => {
    if (sensitiveKeys.map((k) => k.toLowerCase()).includes(key.toLowerCase())) {
      res[key] = R;
    } else {
      res[key] = redactSensitive(res[key]);
    }
  });
  return res;
};

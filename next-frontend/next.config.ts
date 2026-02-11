import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const reactCompiler: NextConfig["reactCompiler"] =
  process.env.NEXT_REACT_COMPILER === "1"
    ? {
        compilationMode: "infer",
        panicThreshold: "critical_errors",
      }
    : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withBundleAnalyzer(nextConfig);

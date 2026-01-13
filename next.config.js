/**
 * Next.js configuration file.
 * 
 * This configuration:
 * - Sets up development and production settings
 * - Configures React strict mode
 * - Enables SWC minification
 * - Defines build and runtime options
 * 
 * @module next.config
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Enables React's strict mode.
   * 
   * This helps identify potential problems in the application
   * by highlighting unsafe lifecycle methods and legacy APIs.
   * 
   * @type {boolean}
   */
  reactStrictMode: true,

  /**
   * Enables SWC minification for improved build performance.
   * 
   * SWC is a Rust-based compiler that provides faster builds
   * and better minification compared to Babel.
   * 
   * @type {boolean}
   */
  swcMinify: true,

};

module.exports = nextConfig; 
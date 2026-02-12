# Changelog

## [0.2.2](https://github.com/GuiCintra27/Payment-Gateway/compare/v0.2.1...v0.2.2) (2026-02-12)


### Bug Fixes

* **dev:** load gateway .env.local in start-dev ([01d5986](https://github.com/GuiCintra27/Payment-Gateway/commit/01d598642b5ce7b1b83f25f6dae5e200ce276948))
* **security:** harden auth cookies and public rate limits ([575c852](https://github.com/GuiCintra27/Payment-Gateway/commit/575c8528db3ba25fcafb6282e59aad518eb71bb6))

## [0.2.1](https://github.com/GuiCintra27/Payment-Gateway/compare/v0.2.0...v0.2.1) (2026-02-11)


### Bug Fixes

* **frontend:** stabilize build and caching ([b7b6aa9](https://github.com/GuiCintra27/Payment-Gateway/commit/b7b6aa9dddad099670a0928c29aa9d009a046c99))

## [0.2.0](https://github.com/GuiCintra27/Payment-Gateway/compare/v0.1.0...v0.2.0) (2026-02-11)


### Features

* add commitizen to the project and rename next middleware.ts to proxy.ts ([fb2e358](https://github.com/GuiCintra27/Payment-Gateway/commit/fb2e358338be624140e9754902e9176997a76034))
* **core:** harden gateway processing and antifraud worker ([594175f](https://github.com/GuiCintra27/Payment-Gateway/commit/594175fb15010c55b74877f079a3732789c20b51))
* **dev:** harden start-dev script ([f325995](https://github.com/GuiCintra27/Payment-Gateway/commit/f3259958ffd63e4e40d8363cf67ed97823046eb2))
* initial project setup ([7ea5a8e](https://github.com/GuiCintra27/Payment-Gateway/commit/7ea5a8ec0815a567a67d1186dad42cf05fcb70e5))
* **p0-p1:** implement reliability and observability upgrades ([0389650](https://github.com/GuiCintra27/Payment-Gateway/commit/0389650ab51e36b08a44acf0153049392607c08f))
* **p2:** implement audit trail, monitoring, ci, hmac rotation ([cc8e24c](https://github.com/GuiCintra27/Payment-Gateway/commit/cc8e24c6bc682598229a20c40ef24c1910c70008))
* **ui:** add invoice pdf download ([abbff8e](https://github.com/GuiCintra27/Payment-Gateway/commit/abbff8ec7d1441a2e8b78545c69694d2c2da84f1))
* **ui:** colorize status badges ([1be7e6c](https://github.com/GuiCintra27/Payment-Gateway/commit/1be7e6caf2cdeab194d975762a36c3b8d654e6cb))
* **ui:** premium dark redesign ([5fb3ab3](https://github.com/GuiCintra27/Payment-Gateway/commit/5fb3ab3739ca33aaf1dc5dc50078102b8978f120))


### Bug Fixes

* **ci:** align kafka serializer typing ([60cf548](https://github.com/GuiCintra27/Payment-Gateway/commit/60cf54815211090a166000f524ea61d079ff2898))
* **ci:** align node uid defaults for compose ([a6d2de7](https://github.com/GuiCintra27/Payment-Gateway/commit/a6d2de77ec06892b9539aa3c25fb9cf9555d62ea))
* **ci:** avoid concurrent npm ci for antifraud ([c01444c](https://github.com/GuiCintra27/Payment-Gateway/commit/c01444c6f66cebf64f98c7dfa21c372a33daa5d5))
* **ci:** chown antifraud app tree for dev start ([87ac00b](https://github.com/GuiCintra27/Payment-Gateway/commit/87ac00b414354eb5eca67215d304494a2aab4a6d))
* **ci:** harden kafka typing and go cache ([a20f694](https://github.com/GuiCintra27/Payment-Gateway/commit/a20f694b71e42891a2d9a15dbeb0e5c35a22b92a))
* **ci:** keep kafka worker on dev entry ([086173d](https://github.com/GuiCintra27/Payment-Gateway/commit/086173d746bc8df4701245350dcb3021f477b71e))
* **ci:** seed antifraud env for smoke ([6f9779a](https://github.com/GuiCintra27/Payment-Gateway/commit/6f9779a743ac298af5454b3ef0cf805fe65c3902))
* **ci:** stabilize antifraud smoke startup ([7ddcb2e](https://github.com/GuiCintra27/Payment-Gateway/commit/7ddcb2e4adc0e6856b780cc1d408d86cd5a0fa7b))
* **ci:** stabilize smoke env for compose ([52c54ef](https://github.com/GuiCintra27/Payment-Gateway/commit/52c54ef7dfb5fc87aa867f52534e509e792d7a78))
* **ci:** use npm ci for nestjs migrations ([eff1ba1](https://github.com/GuiCintra27/Payment-Gateway/commit/eff1ba1ffb7ccb1996fffd7d2a923aa3051c50ac))
* **core:** harden async antifraud flow ([e54aee7](https://github.com/GuiCintra27/Payment-Gateway/commit/e54aee7cff3494d8b5c5d2a4ecf4c71f81be98e7))
* **dev:** harden auto port selection ([b26fbb2](https://github.com/GuiCintra27/Payment-Gateway/commit/b26fbb2c9539d193781847875c1d0a34ca8afd7e))
* **dev:** stabilize local startup env and permissions ([faee86f](https://github.com/GuiCintra27/Payment-Gateway/commit/faee86fd0b267c21fc5741b23871ea908add61bb))
* **e2e:** harden flow and close P3 test gate ([3b467e6](https://github.com/GuiCintra27/Payment-Gateway/commit/3b467e6957450d1311ac04b13d1b74a1c9189a31))
* **release:** require PAT for release-please ([960c855](https://github.com/GuiCintra27/Payment-Gateway/commit/960c85564cc4ad89c4c9dca4c2326bab6994ba2c))

## Changelog

All notable changes to this project will be documented in this file.

This file is managed by `release-please` based on conventional commits.

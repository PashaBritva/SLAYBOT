const ISO6391 = require("iso-639-1");
const sourcebin = require("sourcebin_js");
const { error, debug } = require("@src/helpers/logger");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const gTranslate = require("@vitalets/google-translate-api");

/**
 * Returns JSON response from url
 * @param {string} url
 */
async function getJson(url) {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return {
      success: response.status === 200 ? true : false,
      status: response.status,
      data: json,
    };
  } catch (ex) {
    debug(`Url: ${url}`);
    error(`getJson`, ex);
    return {
      success: false,
    };
  }
}

/**
 * Returns buffer from url
 * @param {string} url
 */
async function getBuffer(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    return {
      success: response.status === 200 ? true : false,
      status: response.status,
      buffer,
    };
  } catch (ex) {
    debug(`Url: ${url}`);
    error(`getBuffer`, ex);
    return {
      success: false,
    };
  }
}

/**
 * Translates the provided content to the specified language code.
 * @param {string} content
 * @param {string} outputCode
 * @returns {Promise<Object|null>}
 */
async function translate(content, outputCode) {
  try {
    if (!content || typeof content !== "string") {
      throw new Error("Invalid content. Please provide a valid string to translate.");
    }
    if (!outputCode || typeof outputCode !== "string" || !ISO6391.validate(outputCode)) {
      throw new Error(`Invalid output language code: ${outputCode}. Please use a valid ISO-639 code.`);
    }

    const response = await gTranslate(content, { to: outputCode });

    return {
      input: response.from.text.value || content,
      output: response.text,
      inputCode: response.from.language.iso,
      outputCode: outputCode,
      inputLang: ISO6391.getName(response.from.language.iso) || "Unknown",
      outputLang: ISO6391.getName(outputCode) || "Unknown",
    };
  } catch (ex) {
    error("translate", ex);
    debug(`Failed to translate content: "${content}" to language code: "${outputCode}"`);
    return null;
  }
}

/**
 * Posts the provided content to the BIN
 * @param {string} content
 * @param {string} title
 */
async function postToBin(content, title) {
  try {
    const response = await sourcebin.create(
      [
        {
          name: " ",
          content,
          languageId: "text",
        },
      ],
      {
        title,
        description: " ",
      }
    );
    return {
      url: response.url,
      short: response.short,
      raw: `https://cdn.sourceb.in/bins/${response.key}/0`,
    };
  } catch (ex) {
    error(`postToBin`, ex);
  }
}

module.exports = {
  translate,
  postToBin,
  getJson,
  getBuffer,
};

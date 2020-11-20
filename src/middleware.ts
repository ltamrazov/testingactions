const jsonwebtoken = require('jsonwebtoken');
const axios = require('axios');

const jwtSecret = 'gorillaz';
const jwtRefreshSecret = 'notgorillaz';
const DECODED_TOKEN_KEY = 'tm_decoded_token';

function clearCookies(res) {
  res.clearCookie('at');
  res.clearCookie('rt');
}

function rejectRequest(
  res,
  message: any = {},
) {
  clearCookies(res);
  return res.status(403).send(message);
}

function getSignatureFromJWT(jwtToken) {
  if (!jwtToken || !jwtToken.includes('.')) {
    return undefined;
  }
  return jwtToken.split('.')[2];
}

/**
 * Gets the date now and returns the number value
 * Used to store iat and to ensure that the token has not expired.
 *
 */
function getCurrentTimeInSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
* Using the iat number provided, it will convert it to date
* Used by verify function when it throws an error about the token being expired,
* this will provide the time that the token has expired.
*
* @param iat - number
*/
function getDateFromIat(iat) {
  if (typeof iat !== 'number') throw Error('You must provide a number to the getDateFromIat helper function!');
  return new Date(iat * 1000);
}

const expirations = {
  accessToken: 60 * 5, // 60*5
  refreshToken: 60 * 60 * 24 * 30, /** in seconds 1 month */
};

/**
* This function will verify the token
* if the wrong signature or token were provided it will return an error
* if the token has expired it will return an error
* otherwise it will return the decoded token
*
* @param token
* @param secret
* @param options
*/
function verify(token, secret, options?) {
  const retVal = {
    isValid: false,
    expiredAt: null,
    decoded: null,
    error: null,
  };

  try {
    const decoded = jsonwebtoken.verify(token, secret, options);
    const timeNow = getCurrentTimeInSeconds();
    const expiresAt = expirations[options?.isRefreshToken ? 'refreshToken' : 'accessToken'] + decoded.iat;

    if (timeNow >= expiresAt) {
      retVal.expiredAt = getDateFromIat(expiresAt);
    } else {
      retVal.isValid = true;
    }

    retVal.decoded = decoded;
    return retVal;
  } catch (error) {
    retVal.error = error;
    return retVal;
  }
}

function sign(payload, secret, options?) {
  const iat = getCurrentTimeInSeconds();
  const token = jsonwebtoken.sign({
    ...payload,
    iat,
  }, secret, options);

  return {
    token,
    iat,
    decoded: {
      ...payload,
      iat,
    },
  };
}

export const renewTokenMiddleware = (renewTokenEndpoint = 'http://localhost:5002/renew_token') => {
  if (!renewTokenEndpoint) {
    throw Error('You must provide the endpoint where the tokens will be renewed!');
  }

  return async (req, res, next) => {
    /**
    * if this is true
    * it's a anonymous user
    * keep going..
    *
    */
    if (!req.headers.authorization && !req.cookies.at && !req.cookies.rt) {
      return next();
    }

    /**
    * if any of the 3 factors is missing
    * the request is invalid
    * return error
    *
    */
    if (!req.headers.authorization || !req.cookies.at || !req.cookies.rt) {
      return rejectRequest(res);
    }

    /**
    * if the headers authorization
    * doesn't match cookies access token
    * return error
    *
    */
    if (req.headers.authorization !== getSignatureFromJWT(req.cookies.at)) {
      return rejectRequest(res);
    }

    const accessToken: string = req.cookies.at;
    const accessTokenResult = verify(accessToken, jwtSecret);

    /**
    * if the token is invalid
    * return error
    *
    */
    if (!accessTokenResult.isValid && accessTokenResult.error) {
      return rejectRequest(res);
    }

    const refreshToken: string = req.cookies.rt;
    const refreshTokenResult = verify(
      refreshToken, jwtRefreshSecret, {
        isRefreshToken: true,
      },
    );

    /**
    * if the refresh token is not valid
    * return error
    *
    */
    if (!refreshTokenResult.isValid) {
      return rejectRequest(res);
    }

    /**
    * if subs don't match
    * return error
    */
    if (refreshTokenResult.decoded.sub !== accessTokenResult.decoded.sub) {
      return rejectRequest(res);
    }

    /**
    * if access token is valid
    * store decoded object inside request
    * and keep going..
    *
    */
    if (accessTokenResult.isValid) {
      req[DECODED_TOKEN_KEY] = accessTokenResult.decoded;
      return next();
    }

    /**
    * access token is expired so make
    * send a request to the /renew_token and return
    */
    try {
      const result = await axios.request({
        url: renewTokenEndpoint,
        method: 'post',
        withCredentials: true,
        headers: {
          Cookie: `rt=${refreshToken}`,
        },
      });

      if (result.data.error) {
        return rejectRequest(res);
      }

      const newAccessToken: string = result.data.at;

      res.set('authorization', newAccessToken);
      res.cookie('at', newAccessToken);

      return next();
    } catch (error) {
      console.log(error);
      return rejectRequest(res, {
        error: {
          code: 'request_failed',
          msg: 'Service not available',
        },
      });
    }
  };
};

export default {
  renewTokenMiddleware,
};

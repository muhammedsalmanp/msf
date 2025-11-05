import mcache from 'memory-cache';

const cacheMiddleware = (durationInSeconds) => {
  return (req, res, next) => {

    let key = req.method + '-' + req.originalUrl || req.url;
    
    let cachedBody = mcache.get(key);
    
    if (cachedBody) {

      return res.send(cachedBody);

    } else {

      res.sendResponse = res.send; 

      res.send = (body) => {
        mcache.put(key, body, durationInSeconds * 1000);
        res.sendResponse(body); 
      };
      
      next(); 
    }
  };
};

export default cacheMiddleware;
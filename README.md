#iosched.js
a simple REST service that parses the publicly available 'Iolani iCal schedule to determine the cycle and schedule type

##Dependencies
iosched.js requires the following Node modules, which can be installed by running `npm install`:

1. express
2. ical
3. lodash
4. xdate

 
##To run: 
 `node index.js`

##To query: 
  // for current date
  GET http://server:3000
  // for a specific date
  GET http://server:3000/2014-05-30

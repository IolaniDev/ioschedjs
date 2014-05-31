var ical  = require('ical'),
    fs    = require('fs'),
    XDate = require('xdate'),
    express = require('express'),
    _ = require('lodash');

var PORT = 3000;

var schedulePeriods = JSON.parse(fs.readFileSync('periods.json'));
var cyclePeriods    = JSON.parse(fs.readFileSync('cycles.json'));

var app = express();
app.get('/:date?', function (req, res) {

  // get the argument date or today if absent //
  var argdate = (req.params['date'])? 
  new XDate(req.params['date']):
  XDate.today();

  // compute start of the week //
  var wstart = new XDate(argdate);
  wstart.addDays(-wstart.getDay() + 1);    // subtract day of week to get Sunday, add one for Monday //
  var wend = new XDate(wstart).addDays(5); // add 5 days to start for end of school week //

  var iCalURL = 'http://iolani.org/bellSchedule_calendar/ical.ics';
  ical.fromURL(iCalURL, {}, function(err, data) {
    // filter to just events this week, transform format to something simpler //
    var weekEvents = _(data)
      .values()
      .filter(function (vevent) {
        var zdate = new XDate(vevent.start);
        return vevent.type == 'VEVENT' 
          && zdate >= wstart
          && zdate < wend;
      })
      .map(function (vevent) {
        return {
          date: vevent.start,
          name: vevent.summary
        }
      })
      .sortBy('date')
      .value();
    
    // get the cycle by finding first match //
    var cycleNumber = _(weekEvents)
      .map(function (ev) {
        var matches = /\(Cycle (\d)\)/.exec(ev.name);
        return matches? parseInt(matches[1]): null;
      })
      .compact()
      .first();
   
    // get the schedule item for today //
    var scheduleName = _(weekEvents)
      .filter(function (ev) {
        var zdate = new XDate(ev.date);
        return zdate.toString('yyyy-MM-dd') == argdate.toString('yyyy-MM-dd')
          && ev.name.indexOf('Schedule') >= 0;
      })
      .pluck('name')
      .map(function (name) {
        // remove random stuff in parens after schedule name //
        var schedIndex = name.indexOf(' Schedule');
        return schedIndex >= 0? name.substring(0, schedIndex): name;
      })
      .first();

    
    var ret = {
        date: argdate.toString('yyyy-MM-dd'),
        cycle: cycleNumber,
        scheduleName: scheduleName
      };
    
    // check for a matching (by name) schedule in the master file //
    if(ret.scheduleName) {
        ret.periodTimes = schedulePeriods[ret.scheduleName];
    }
    // check for cycle //
    if(ret.cycle) {
        ret.cyclePeriods = cyclePeriods[ret.cycle.toString()];
    }
    
    res.json(ret);
  });
});

app.listen(PORT);
console.log('Started calendar service on HTTP port ' + PORT);

var fs = require('fs');
var _ = require("lodash");
var debug = require("debug")("detector");

var config = require("./config.json");

var orgs = require("./data/organizations.json");
var students = require("./data/students.json");
var stu_attending = {};

var dat_conflict = [];
var dat_map = {};
var id_to_name = [];

var cls_sum = _.keys(orgs).length;

_(_.range(cls_sum)).forEach((i) => {
  dat_conflict[i] = [];
  _(_.range(cls_sum)).forEach((j) => {
    dat_conflict[i][j] = false;
  });
  dat_conflict[i][i] = true;
});

_(students).forEach((cls, cls_name) => {
  dat_map[cls_name] = [{}, {}];
});

var __index = 0;

_(orgs).forEach((org, name) => {
  _(org.classes).forEach((cls) => {
    dat_map[cls][org.Selected ? 1 : 0][org.course] = __index;
  });
  id_to_name[__index] = name;
  __index++;
});

_(students).forEach((stus, cls) => {
  _(stus).forEach((student, id) => {
    var __attending = [];
    _(student).forEach((course) => {
      var crs = dat_map[cls][1][course];
      __attending.push(crs);
    });
    _(_.without.apply(_, [config.courses].concat(student))).forEach((course) => {
      if(course in dat_map[cls][0]) {
        __attending.push(dat_map[cls][0][course]);
      }
    });
    _(__attending).forEach((i) => {
      _(__attending).forEach((j) => {
        dat_conflict[i][j] = dat_conflict[j][i] = true;
      });
    });
    if(!(cls in stu_attending)) {
      stu_attending[cls] = {};
    }
    stu_attending[cls][id] = __attending;
  });
});

var conflict = _.map(_.range(cls_sum), (n) => { return [n]; });
var k = 0;

while(k < conflict.length) {
  var cur = conflict[k];
  //debug(cur);
  for(var i = _.last(cur) + 1; i <= cls_sum; i++) {
    var flag = true;
    for(var j of cur) {
      if(!dat_conflict[j][i]) {
        flag = false;
        break;
      }
    }
    if(flag) {
      var new_conflict = _.map(cur, _.clone);
      new_conflict.push(i);
      conflict.push(new_conflict);
    }
  }
  k++;
}

var max_time_required = _.max(_.map(conflict, (courses) => {
  return _.sum(_.map(courses, (n) => { return orgs[id_to_name[n]].req; }));
}));

debug("Estimated Courses Required: " + max_time_required);

var selected = _.map(_.range(cls_sum), () => { return false; });
var courseList = _.map(_.range(max_time_required), () => { return []; });

function findNotConflict(courseList, course) {
  var cls_id = -1;
  _.chain(_.map(courseList, (n, id) => {
    return {"id": id, "val": n};
  })).sortBy("length").reverse().value().forEach((__val) => {
    var flag = true;
    var val = __val.val;
    var id = __val.id;
    _(val).forEach((crs) => {
      if(dat_conflict[crs][course]) {
        flag = false;
        return false;
      }
    });
    if(flag) {
      cls_id = id;
      return false;
    }
  });
  return cls_id;
}

_(conflict).reverse().forEach((courses) => {
  _(courses).forEach((courseN) => {
    if(!selected[courseN]) {
      var course = orgs[id_to_name[courseN]];
      _.map(_.range(course.req), () => {
        var __id = findNotConflict(courseList, courseN);
        if(__id == -1) {
          courseList.push([courseN]);
        } else {
          courseList[__id].push(courseN);
        }
      });
      selected[courseN] = true;
    }
  });
});

debug(courseList);

fs.writeFileSync('data/orgtimetable.json', JSON.stringify(courseList));
var num = "23";

debug(students["3"][num]);
_(stu_attending["3"][num]).forEach((crs) => {
  debug(id_to_name[crs]);
});

_(courseList).forEach((crss, id) => {
  _(stu_attending["3"][num]).forEach((crs) => {
    if(_.includes(crss, crs)) {
      debug(id + ": " + id_to_name[crs]);
    }
  });
});

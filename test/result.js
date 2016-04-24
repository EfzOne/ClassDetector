var expect = require("chai").expect;
var data = require("../data/students.json");
var _ = require("lodash");
var debug = require("debug")("exporter:test");

describe("Class Exporter", function() {
  describe("Courses", function() {
    it("should be three courses per person", function() {
      _(data).forEach((cls, cls_number) => {
        _(cls).forEach((student, stu_number) => {
          expect(student).to.have.lengthOf(3);
        });
      });
    });
  });
});

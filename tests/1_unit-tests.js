// import { assert } from "chai";
const {assert} = require('chai')

describe('Basic Assertions', function() {
    it('#1 should check null', function() {
        assert.isNull(null, "yeah this is null");
        assert.isNotNull(true, "yeah this is not null");
    });
});
// assert.isNull(null, "yea this is null")
// assert.isNotNull(true, "yea this is not null")

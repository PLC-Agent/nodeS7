const { describe, it } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
const NodeS7 = require('../nodeS7');
const { checkRFCData } = NodeS7._internal;

describe('checkRFCData - Packet validation', function() {
	it('should reject packets shorter than 7 bytes', function() {
		const data = Buffer.from([0x03, 0x00, 0x00, 0x05, 0x02]);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'error');
	});

	it('should reject non-buffer input', function() {
		const result = checkRFCData('not a buffer');
		assert.strictEqual(result, 'error');
	});

	it('should reject null input', function() {
		const result = checkRFCData(null);
		assert.strictEqual(result, 'error');
	});

	it('should reject wrong RFC version', function() {
		// RFC version 0x04 instead of 0x03
		const data = Buffer.from([0x04, 0x00, 0x00, 0x07, 0x02, 0xf0, 0x00]);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'error');
	});

	it('should reject wrong TPDU code', function() {
		// TPDU code 0xe0 instead of 0xf0
		const data = Buffer.from([0x03, 0x00, 0x00, 0x07, 0x02, 0xe0, 0x00]);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'error');
	});

	it('should detect fast acknowledge packet', function() {
		// Valid fast ACK: RFC=0x03, length=7, TPDU=0xf0, LastDataUnit bit 7 = 0
		const data = Buffer.from([0x03, 0x00, 0x00, 0x07, 0x02, 0xf0, 0x00]);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'fastACK');
	});

	it('should accept valid S7 data packet', function() {
		// Valid S7 data: RFC=0x03, TPDU=0xf0, LastDataUnit bit 7 = 1 (0x80)
		const data = Buffer.from([
			0x03, 0x00, 0x00, 0x1b, 0x02, 0xf0, 0x80,
			0x32, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x08, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x00,
			0x00, 0x01, 0x00, 0x01, 0x00, 0xf0
		]);
		const result = checkRFCData(data);
		assert.ok(Buffer.isBuffer(result));
		assert.strictEqual(result.length, data.length);
	});

	it('should handle double fast ACK + S7 data packet', function() {
		// Fast ACK (7 bytes) + S7 data packet
		const fastAck = Buffer.from([0x03, 0x00, 0x00, 0x07, 0x02, 0xf0, 0x00]);
		const s7Data = Buffer.from([
			0x03, 0x00, 0x00, 0x1b, 0x02, 0xf0, 0x80,
			0x32, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x08, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x00,
			0x00, 0x01, 0x00, 0x01, 0x00, 0xf0
		]);
		const combined = Buffer.concat([fastAck, s7Data]);
		const result = checkRFCData(combined);
		// Should slice off the fast ACK and return the S7 data
		assert.ok(Buffer.isBuffer(result));
		assert.strictEqual(result.length, s7Data.length);
	});

	it('should reject packet with invalid TPKT length (too small)', function() {
		// TPKT length = 3 (less than minimum 7)
		const data = Buffer.from([0x03, 0x00, 0x00, 0x03, 0x02, 0xf0, 0x00]);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'error');
	});
});

describe('checkRFCData - Security edge cases', function() {
	it('should handle TPKT length mismatch (declared > actual)', function() {
		// TPKT says 100 bytes but buffer is only 7
		const data = Buffer.from([0x03, 0x00, 0x00, 0x64, 0x02, 0xf0, 0x80]);
		const result = checkRFCData(data);
		// Should still process it since LastDataUnit=1 and TPKT_Length > data.length
		// The existing logic returns 'error' for this case
		assert.strictEqual(result, 'error');
	});

	it('should handle empty buffer', function() {
		const data = Buffer.alloc(0);
		const result = checkRFCData(data);
		assert.strictEqual(result, 'error');
	});
});

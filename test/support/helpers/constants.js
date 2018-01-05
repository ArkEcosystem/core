'use strict';

module.exports = {
	activeDelegates: 51,
	maximumVotes: 1,
	addressLength: 208,
	blockHeaderLength: 248,
	confirmationLength: 77,
	epochTime: new Date(Date.UTC(2017, 2, 21, 13, 0, 0, 0)),
	fees:{
		send: 10000000,
		vote: 100000000,
		secondsignature: 500000000,
		delegate: 2500000000,
		multisignature: 500000000
	},
	feeStart: 1,
	feeStartVolume: 10000 * 100000000,
	fixedPoint : Math.pow(10, 8),
	forgingTimeOut: 3060, // 102 blocks / 2 rounds
	maxAddressesLength: 208 * 128,
	maxAmount: 100000000,
	maxClientConnections: 100,
	maxConfirmations : 77 * 100,
	maxPayloadLength: 2 * 1024 * 1024,
	maxRequests: 10000 * 12,
	maxSignaturesLength: 196 * 256,
	maxTxsPerBlock: 50,
	blocktime: 8,
	numberLength: 100000000,
	requestLength: 104,
	rewards: {
		milestones: [
			200000000, // Initial Reward
			200000000, // Milestone 1
			200000000, // Milestone 2
			200000000, // Milestone 3
			200000000  // Milestone 4
		],
		offset: 75600,   // Start rewards at block, ie 7 days after net start
		distance: 3000000, // Distance between each milestone
	},
	signatureLength: 196,
	totalAmount: 12500000000000000,
	unconfirmedTransactionTimeOut: 10800 // 1080 blocks
};

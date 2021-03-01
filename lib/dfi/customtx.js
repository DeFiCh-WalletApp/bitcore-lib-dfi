'use strict'

var _ = require('lodash');
var BN = require('../crypto/bn');
var BufferWriter = require('../encoding/bufferwriter');
var $ = require('../util/preconditions');
let BufferUtil = require('../util/buffer');
var CBalances = require('./deserialiizeTypes').CBalances;
var CScript = require('./deserialiizeTypes').CScript;
var CAccounts = require('./deserialiizeTypes').CAccounts;

var customTxType = {
  createMasternode: 'C',
  resignMasternode: 'R',
  createToken: 'T',
  mintToken: 'M',
  updateToken: 'N',
  updateTokenAny: 'n',
  createPoolPair: 'p',
  updatePoolPair: 'u',
  poolSwap: 's',
  addPoolLiquidity: 'l',
  removePoolLiquidity: 'r',
  utxosToAccount: 'U',
  accountToUtxos: 'b',
  accountToAccount: 'B',
  setGovVariable: 'G',
  anyAccountsToAccounts: 'a',
};

var CUSTOM_SIGNATURE = 'DfTx';

var CreateMasternode = function CreateMasternode(arg, network) {
  if (!(this instanceof CreateMasternode)) {
    return new CreateMasternode(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return CreateMasternode.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return CreateMasternode.toBuffer(arg);
  }
};

CreateMasternode.fromBuffer = function(buffer, network) {
  var data = {};
  data.operatorType = buffer.readUInt8();
  data.operatorAuthAddress = buffer.read(20).toString('hex');
  return data;
};

CreateMasternode.toBuffer = function (data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.createMasternode));
  bw.writeUInt8(data.operatorType);
  bw.write(new Buffer(data.operatorAuthAddress));
  return bw.toBuffer();
};

var ResignMasternode = function(arg, network) {
  if (!(this instanceof ResignMasternode)) {
    return new ResignMasternode(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return ResignMasternode.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return ResignMasternode.toBuffer(arg);
  }
};

ResignMasternode.fromBuffer = function(br, network) {
  var data = {};
  data.nodeId = br.read(32).toString('hex');
  return data;
};

ResignMasternode.toBuffer = function (data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.resignMasternode));
  bw.write(new Buffer(data.nodeId));
  return bw.toBuffer();
};

var CreateToken = function CreateToken(arg, network) {
  if (!(this instanceof CreateToken)) {
    return new CreateToken(arg);
  }
  if (arg.buf && BufferUtil.isBuffer(arg.buf)) {
    return CreateToken.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return CreateToken.toBuffer(arg);
  }
};

CreateToken.fromBuffer = function(br, network) {
  var data = {};
  var lenSymbol = br.readVarintNum();
  data.symbol = br.read(lenSymbol).toString();
  var lenName = br.readVarintNum();
  data.name = br.read(lenName).toString();
  data.decimal = br.readUInt8();
  data.limit = br.readUInt64LEBN().toNumber();
  data.flags = br.readUInt8();
  return data;
};

CreateToken.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.createToken));
  bw.writeVarintNum(data.symbol.length);
  bw.write(new Buffer(data.symbol));
  bw.writeVarintNum(data.name.length);
  bw.write(new Buffer(data.name));
  bw.writeUInt8(BN.fromNumber(data.decimal));
  bw.writeUInt64LEBN(BN.fromNumber(data.limit));
  bw.writeUInt8(data.flags);
  return bw.toBuffer();
};

var MintToken = function MintToken(arg, network) {
  if (!(this instanceof MintToken)) {
    return new MintToken(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return MintToken.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return MintToken.toBuffer(arg);
  }
};

MintToken.fromBuffer = function(br, network) {
  var data = {};
  data.minted = new CBalances(br);
  return data;
};

MintToken.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.mintToken));
  bw = new CBalances(data.minted, bw);
  return bw.toBuffer();
};

var UpdateToken = function UpdateToken(arg, network) {
  if (!(this instanceof UpdateToken)) {
    return new UpdateToken(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return UpdateToken.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return UpdateToken.toBuffer(arg);
  }
};

UpdateToken.fromBuffer = function(br, network) {
  var data = {};
  data.tokenTx = br.read(32).toString('hex');
  data.isDAT = br.readUInt8();
  return data;
};

UpdateToken.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.updateToken));
  bw.write(new Buffer(data.tokenTx));
  bw.writeUInt8(data.isDAT);
  return bw.toBuffer();
};

var UpdateTokenAny = function UpdateTokenAny(arg, network) {
  if (!(this instanceof UpdateTokenAny)) {
    return new UpdateTokenAny(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return UpdateTokenAny.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return UpdateTokenAny.toBuffer(arg);
  }
};

UpdateTokenAny.fromBuffer = function(br, network) {
  var data = {};
  data.tokenTx = br.read(32).toString('hex');
  var len = br.readUInt8();
  var symbol = br.read(len).toString();
  len = br.readUInt8();
  var name = br.read(len).toString();
  data.newToken = {
    symbol: symbol,
    name: name,
    decimal: br.readUInt8(),
    limit: br.readUInt64LEBN().toNumber(),
    flags: br.readUInt8(),
  };
  return data;
};

UpdateTokenAny.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.updateTokenAny));
  bw.write(new Buffer(data.tokenTx));
  bw.writeVarintNum(data.symbol.length);
  bw.write(new Buffer(data.symbol));
  bw.writeVarintNum(data.name.length);
  bw.write(new Buffer(data.name));
  bw.writeUInt8(data.decimal);
  bw.writeUInt64LEBN(BN.fromNumber(data.limit));
  bw.writeUInt8(data.mintable);
  bw.writeUInt8(data.tradeable);
  bw.writeUInt8(data.isDAT);
  return bw.toBuffer();
};

var CreatePoolPair = function CreatePoolPair(arg, network) {
  if (!(this instanceof CreatePoolPair)) {
    return new CreatePoolPair(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return CreatePoolPair.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return CreatePoolPair.toBuffer(arg);
  }
};

CreatePoolPair.fromBuffer = function(br, network) {
  var data = {};
  data.idTokenA = br.readVarintNum();
  data.idTokenB = br.readVarintNum();
  data.commission = br.readUInt64LEBN().toNumber() / 100000000 ;
  data.ownerAddress = CScript.fromBuffer(br, network);
  data.status = br.readUInt8();
  return data;
};

CreatePoolPair.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.createPoolPair));
  bw.writeVarintNum(data.idTokenA);
  bw.writeVarintNum(data.idTokenB);
  bw.writeUInt64LEBN(data.commission * 100000000);
  bw = new CScript(data.ownerAddress, bw);
  bw.writeUInt8(data.status);
  return bw.toBuffer();
};

var UpdatePoolPair = function UpdatePoolPair(arg, network) {
  if (!(this instanceof UpdatePoolPair)) {
    return new UpdatePoolPair(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return UpdatePoolPair.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return UpdatePoolPair.toBuffer(arg);
  }
};

UpdatePoolPair.fromBuffer = function(br, network) {
  var data = {};
  data.pollId = br.readUInt32LE().toString();
  data.status = br.readUInt8();
  data.commission = br.readUInt64LEBN().toNumber();
  data.ownerAddress = CScript.fromBuffer(br, network);
  return data;
};

UpdatePoolPair.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.updatePoolPair));
  bw.writeUInt32LE(data.pollId);
  bw.writeUInt8(data.status);
  bw.writeUInt64LEBN(BN.fromNumber(data.commission));
  bw = new CScript(data.ownerAddress, bw);
  return bw.toBuffer();
};

var PoolSwap = function PoolSwap(arg, network) {
  if (!(this instanceof PoolSwap)) {
    return new PoolSwap(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return PoolSwap.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return PoolSwap.toBuffer(arg);
  }
};

PoolSwap.fromBuffer = function(br, network) {
  var data = {};
  data.from = CScript.fromBuffer(br);
  data.idTokenFrom = br.readVarintNum();
  data.amountFrom = br.readUInt64LEBN().toNumber() / 100000000;
  data.to = CScript.fromBuffer(br, network);
  data.idTokenTo = br.readVarintNum();
  data.maxPrice = {
    integer: br.readUInt64LEBN().toNumber() / 100000000,
    fraction: br.readUInt64LEBN().toNumber() / 100000000,
  };
  return data;
};

PoolSwap.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.poolSwap));
  bw = new CScript(data.from, bw);
  bw.writeUInt32LE(data.idTokenFrom);
  bw.writeUInt64LEBN(BN.fromNumber(data.amountFrom));
  bw = new CScript(data.to, bw);
  bw.writeUInt32LE(data.idTokenTo);
  bw.writeUInt64LEBN(data.maxPrice.integer * 100000000);
  bw.writeUInt64LEBN(data.maxPrice.fraction * 100000000);
  return bw.toBuffer();
};

var AddPoolLiquidity = function AddPoolLiquidity(arg, network) {
  if (!(this instanceof AddPoolLiquidity)) {
    return new AddPoolLiquidity(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return AddPoolLiquidity.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return AddPoolLiquidity.toBuffer(arg);
  }
};

AddPoolLiquidity.fromBuffer = function(br, network) {
  var data = {};
  var from = {};
  var count = br.readVarintNum();
  for (var i = 0; i < count;  i++) {
    from[CScript.fromBuffer(br)] = new CBalances(br);
  }
  data.from = from;
  data.shareAddress = CScript.fromBuffer(br, network);
  return data;
};

AddPoolLiquidity.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.addPoolLiquidity));
  var size = data.from.size();
  bw.writeVarintNum(size);
  for (var entry of data.from) {
    bw = new CScript(entry[0], bw);
    bw = new CBalances(entry[1], bw);
  }
  bw = new CScript(data.shareAddress, bw);
 return bw.toBuffer();
};

var RemovePoolLiquidity = function RemovePoolLiquidity(arg, network) {
  if (!(this instanceof RemovePoolLiquidity)) {
    return new RemovePoolLiquidity(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return RemovePoolLiquidity.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return RemovePoolLiquidity.toBuffer(arg);
  }
};

RemovePoolLiquidity.fromBuffer = function(br, network) {
  var data = {};
  data.from = CScript.fromBuffer(br, network);
  data.nTokenId = br.readVarintNum();
  data.nValue = br.readUInt64LEBN().toNumber() / 100000000;
  return data;
};

RemovePoolLiquidity.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.removePoolLiquidity));
  bw = new CScript(data.form, bw);
  bw.writeVarintNum(data.nTokenId);
  bw.writeUInt64LEBN(data.nValue * 100000000);
 return bw.toBuffer();
};

var SetGovVariable = function SetGovVariable(arg, network) {
  if (!(this instanceof SetGovVariable)) {
    return new SetGovVariable(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return SetGovVariable.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return SetGovVariable.toBuffer(arg);
  }
};

SetGovVariable.fromBuffer = function(br) {
  var data = {};
  var len = br.readVarintNum();
  data.name = br.read(len).toString();
  return data;
};

SetGovVariable.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.setGovVariable));
  bw.writeVarintNum(data.name.length);
  bw.write(new Buffer(data.name));
 return bw.toBuffer();
};

var UtxosToAccount = function UtxosToAccount(arg, network) {
  if (!(this instanceof UtxosToAccount)) {
    return new UtxosToAccount(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return UtxosToAccount.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return UtxosToAccount.toBuffer(arg);
  }
};

UtxosToAccount.fromBuffer = function(br, network) {
  var to = {};
  var count = br.readVarintNum();
  for (var i = 0; i < count;  i++) {
    to[CScript.fromBuffer(br, network)] = new CBalances(br);
  }
  var data = {};
  data.to = to;
  return data;
};

UtxosToAccount.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  var size = data.to.size();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.utxosToAccount));
  bw.writeVarintNum(size);
  for (var entry of data.to) {
    bw = new CScript(entry[0], bw);
    bw = new CBalances(entry[1], bw);
  }
 return bw.toBuffer();
};

var AccountToUtxos = function AccountToUtxos(arg, network) {
  if (!(this instanceof AccountToUtxos)) {
    return new AccountToUtxos(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return AccountToUtxos.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return AccountToUtxos.toBuffer(arg);
  }
};

AccountToUtxos.fromBuffer = function(br, network) {
  var data = {};
  data.from = CScript.fromBuffer(br, network);
  data.balances = new CBalances(br);
  data.mintingOutputsStart = br.readVarintNum();
  return data;
};

AccountToUtxos.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.accountToUtxos));
  bw = new CScript(data.from, bw);
  bw = new CBalances(data.balances, bw);
  bw.writeUInt32LE(data.mintingOutputsStart);
 return bw.toBuffer();
};

var AccountToAccount = function AccountToAccount(arg, network) {
  if (!(this instanceof AccountToAccount)) {
    return new AccountToAccount(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return AccountToAccount.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return AccountToAccount.toBuffer(arg);
  }
};

AccountToAccount.fromBuffer = function(br, network) {
  var data = {};
  data.from = CScript.fromBuffer(br, network);
  var to = {};
  var count = br.readVarintNum();
  for (var i = 0; i < count; i++) {
    to[CScript.fromBuffer(br, network)] = new CBalances(br);
  }
  data.to = to;
  return data;
};

AccountToAccount.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.accountToAccount));
  bw = new CScript(data.from, bw);
  var size = data.to.size();
  bw.writeVarintNum(size);
  for (var entry of data.to) {
    bw = new CScript(entry[0], bw);
    bw = new CBalances(entry[1], bw);
  }
 return bw.toBuffer();
};

var AnyAccountsToAccounts = function AnyAccountsToAccounts(arg, network) {
  if (!(this instanceof AnyAccountsToAccounts)) {
    return new AnyAccountsToAccounts(arg);
  }
  if (BufferUtil.isBuffer(arg.buf)) {
    return AnyAccountsToAccounts.fromBuffer(arg, network);
  }
  if (_.isObject(arg)) {
    return AnyAccountsToAccounts.toBuffer(arg);
  }
};

AnyAccountsToAccounts.fromBuffer = function(br, network) {
  var data = {};
  data.from = new CAccounts(br, null, network);
  data.to = new CAccounts(br, null, network);
  return data;
};

AnyAccountsToAccounts.toBuffer = function(data) {
  $.checkArgument(data, 'data is required');
  var bw = new BufferWriter();
  bw.write(new Buffer(CUSTOM_SIGNATURE));
  bw.write(new Buffer(customTxType.anyAccountsToAccounts));
  bw = new CAccounts(data.from, bw);
  bw = new CAccounts(data.to, bw);
  return bw.toBuffer();
};

module.exports = {
  customTxType: customTxType,
  CreateMasternode: CreateMasternode,
  ResignMasternode: ResignMasternode,
  CreateToken: CreateToken,
  MintToken: MintToken,
  UpdateToken: UpdateToken,
  UpdateTokenAny: UpdateTokenAny,
  CreatePoolPair: CreatePoolPair,
  UpdatePoolPair: UpdatePoolPair,
  PoolSwap: PoolSwap,
  AddPoolLiquidity: AddPoolLiquidity,
  RemovePoolLiquidity: RemovePoolLiquidity,
  UtxosToAccount: UtxosToAccount,
  AccountToUtxos: AccountToUtxos,
  AccountToAccount: AccountToAccount,
  SetGovVariable: SetGovVariable,
  AnyAccountsToAccounts: AnyAccountsToAccounts,
};






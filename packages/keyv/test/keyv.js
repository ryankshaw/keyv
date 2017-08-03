import test from 'ava';
import tk from 'timekeeper';
import keyvTestSuite from 'keyv-test-suite';
import Keyv from 'this';

test.serial('Keyv is a class', t => {
	t.is(typeof Keyv, 'function');
	t.throws(() => Keyv()); // eslint-disable-line new-cap
	t.notThrows(() => new Keyv());
});

test.serial('Keyv accepts storage adapters', async t => {
	const store = new Map();
	const keyv = new Keyv({ store });
	t.is(store.size, 0);
	await keyv.set('foo', 'bar');
	t.is(await keyv.get('foo'), 'bar');
	t.is(store.size, 1);
});

test.serial('Keyv hands tll functionality over to ttl supporting stores', async t => {
	t.plan(3);
	const store = new Map();
	store.ttlSupport = true;
	const storeSet = store.set;
	store.set = (key, val, ttl) => {
		t.is(ttl, 100);
		storeSet.call(store, key, val, ttl);
	};
	const keyv = new Keyv({ store });
	await keyv.set('foo', 'bar', 100);
	t.is(await keyv.get('foo'), 'bar');
	tk.freeze(Date.now() + 150);
	t.is(await keyv.get('foo'), 'bar');
	tk.reset();
});

test.serial('Keyv respects default tll option', async t => {
	const store = new Map();
	const keyv = new Keyv({ store, ttl: 100 });
	await keyv.set('foo', 'bar');
	t.is(await keyv.get('foo'), 'bar');
	tk.freeze(Date.now() + 150);
	t.is(await keyv.get('foo'), undefined);
	tk.reset();
});

test.serial('.set(key, val, ttl) overwrites default tll option', async t => {
	const startTime = Date.now();
	tk.freeze(startTime);
	const store = new Map();
	const keyv = new Keyv({ store, ttl: 200 });
	await keyv.set('foo', 'bar');
	await keyv.set('fizz', 'buzz', 100);
	await keyv.set('ping', 'pong', 300);
	t.is(await keyv.get('foo'), 'bar');
	t.is(await keyv.get('fizz'), 'buzz');
	t.is(await keyv.get('ping'), 'pong');
	tk.freeze(startTime + 150);
	t.is(await keyv.get('foo'), 'bar');
	t.is(await keyv.get('fizz'), undefined);
	t.is(await keyv.get('ping'), 'pong');
	tk.freeze(startTime + 250);
	t.is(await keyv.get('foo'), undefined);
	t.is(await keyv.get('ping'), 'pong');
	tk.freeze(startTime + 350);
	t.is(await keyv.get('ping'), undefined);
	tk.reset();
});

const store = () => new Map();
keyvTestSuite(test, Keyv, store);

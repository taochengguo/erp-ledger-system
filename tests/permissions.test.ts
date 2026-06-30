import assert from 'node:assert/strict';

import { getRolePermissions, hasPermission } from '../src/lib/permissions';

assert.deepEqual(getRolePermissions('admin'), ['order_entry', 'purchase_entry', 'sales_entry', 'system_admin']);

assert.equal(hasPermission({ roleCode: 'order_entry', permissions: ['order_entry'] }, 'order_entry'), true);
assert.equal(hasPermission({ roleCode: 'order_entry', permissions: ['order_entry'] }, 'purchase_entry'), false);
assert.equal(hasPermission({ roleCode: 'order_entry', permissions: [] }, 'order_entry'), false);

assert.equal(hasPermission({ roleCode: 'purchase_entry', permissions: ['purchase_entry'] }, 'purchase_entry'), true);
assert.equal(hasPermission({ roleCode: 'purchase_entry', permissions: ['purchase_entry'] }, 'sales_entry'), false);

assert.equal(hasPermission({ roleCode: 'sales_entry', permissions: ['sales_entry'] }, 'sales_entry'), true);
assert.equal(hasPermission({ roleCode: 'sales_entry', permissions: ['sales_entry'] }, 'order_entry'), false);

assert.equal(hasPermission({ roleCode: 'viewer', permissions: [] }, 'order_entry'), false);

console.log('permission tests passed');

from app.auth import ROLE_PERMISSIONS, has_permission


def test_admin_can_use_every_permission():
    for permission in {
        "order_entry",
        "purchase_entry",
        "sales_entry",
        "system_admin",
    }:
        assert has_permission("admin", permission)


def test_entry_roles_are_separated_by_module():
    assert has_permission("order_entry", "order_entry")
    assert not has_permission("order_entry", "purchase_entry")
    assert not has_permission("order_entry", "sales_entry")

    assert has_permission("purchase_entry", "purchase_entry")
    assert not has_permission("purchase_entry", "order_entry")
    assert not has_permission("purchase_entry", "sales_entry")

    assert has_permission("sales_entry", "sales_entry")
    assert not has_permission("sales_entry", "order_entry")
    assert not has_permission("sales_entry", "purchase_entry")


def test_viewer_has_no_write_permissions():
    assert ROLE_PERMISSIONS["viewer"] == set()
    assert not has_permission("viewer", "order_entry")
    assert not has_permission("unknown", "order_entry")

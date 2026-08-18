from django.db import models

# Global setting filter keys your dashboard is allowed to use.
ITEM_QUERY_FILTERS = {
    "purchased",      # bool
    "store",          # one of Item.Store values
    "type",           # one of Item.ItemType values
    "not_purchased",  # bool-like toggle if you want it
}

class ItemQuerySet(models.QuerySet):
    def purchased(self):
        return self.filter(purchased=True)

    def not_purchased(self):
        return self.filter(purchased=False)

    def by_store(self, store):
        return self.filter(store=store)

    def by_type(self, item_type):
        return self.filter(type=item_type)

    def sort_by_created_at(self, descending=False):
        return self.order_by('-created_at' if descending else 'created_at')

    def sort_by_store(self):
        return self.order_by('store')

    def sort_by_type(self):
        return self.order_by('type')


class ItemManager(models.Manager):
    def get_queryset(self):
        return ItemQuerySet(self.model, using=self._db)

    def purchased(self):
        return self.get_queryset().purchased()

    def not_purchased(self):
        return self.get_queryset().not_purchased()

    def by_store(self, store):
        return self.get_queryset().by_store(store)

    def by_type(self, item_type):
        return self.get_queryset().by_type(item_type)


class Item(models.Model):
    class Store(models.TextChoices):
        WALMART = 'walmart', 'Walmart'
        TARGET = 'target', 'Target'
        RALPHS = 'ralphs', 'Ralphs'
        STATER_BROS = 'stater_bros', 'Stater Bros'
        HMART = 'hmart', 'H-Mart'
        RANCH_99 = '99_ranch', '99 Ranch'
        GENERAL = 'general', 'General'

    class ItemType(models.TextChoices):
        GROCERY = 'grocery', 'Grocery'
        SUPPLIES = 'supplies', 'Supplies'
        HOUSEHOLD = 'household', 'Household'
        PERSONAL_CARE = 'personal_care', 'Personal Care'
        ELECTRONICS = 'electronics', 'Electronics'
        GENERAL = 'general', 'General'

    name = models.CharField(max_length=64)
    store = models.CharField(max_length=20, choices=Store.choices, default=Store.GENERAL)
    created_at = models.DateTimeField(auto_now_add=True)
    purchased = models.BooleanField(default=False)
    type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.GENERAL)

    objects = ItemManager()

    class Meta:
        db_table = "items"

    def __str__(self):
        return self.name
using Sitecore.Data.Items;
using Sitecore.Links;

namespace Starter.Feature.Navigation.Models
{
    public class BreadcrumbItem : CustomItem
    {
        public BreadcrumbItem(Item item) 
            : base(item) { }

        public string Title => InnerItem["Name"];

        //public bool IsActive => Sitecore.Context.Item.ID == InnerItem.ID;

        public string Url => LinkManager.GetItemUrl(InnerItem);
    }
}
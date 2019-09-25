using Sitecore.Data.Items;

namespace Starter.Feature.Navigation.Models
{
    public class BreadcrumbItem : CustomItem
    {
        public BreadcrumbItem(Item item) 
            : base(item) { }

        public string Title { get; set; }

        public string ItemUrl { get; set; }
    }
}
using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Mvc.Presentation;

namespace Starter.Feature.Navigation.Models
{
    public class BreadcrumbItemList : RenderingModel
    {
        public List<BreadcrumbItem> Breadcrumbs { get; set; }
        public override void Initialize(Rendering rendering)
        {
            Breadcrumbs = new List<BreadcrumbItem>();
            var items = GetBreadcrumbItems();
            foreach (var item in items)
            {
                var i = new BreadcrumbItem(item);
                Breadcrumbs.Add(i);
            }
            Breadcrumbs.Add(new BreadcrumbItem(Sitecore.Context.Item));
        }

        private List<Item> GetBreadcrumbItems()
        {
            var homePath = Sitecore.Context.Site.StartPath;
            var homeItem = Sitecore.Context.Database.GetItem(homePath);
            var items = new List<Item> {homeItem};
            items.AddRange(Sitecore.Context.Item.Axes.GetAncestors().ToList());
            return items;
        }
    }
}
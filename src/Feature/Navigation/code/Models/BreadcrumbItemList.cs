using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Links;
using Sitecore.Mvc.Presentation;
using Starter.Feature.Navigation.SitecoreData;

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
                var i = new BreadcrumbItem(item)
                {
                    Title = item.Name,
                    ItemUrl = LinkManager.GetItemUrl(item)
                };
                Breadcrumbs.Add(i);
            }
            Breadcrumbs.Add(new BreadcrumbItem(Sitecore.Context.Item)
            {
                Title = Sitecore.Context.Item.Name,
                ItemUrl = LinkManager.GetItemUrl(Sitecore.Context.Item)
            });

            if (Breadcrumbs.Any(i => i.ItemUrl.Contains(StaticData.WildcardItems.WildcardUrl)))
            {
                var urlSegments = Sitecore.Context.RawUrl.Split('/');
                var eventName = urlSegments[urlSegments.Length - 2];

                var wildcardBreadcrumbItems = Breadcrumbs.Where(i => i.ItemUrl.Contains(StaticData.WildcardItems.WildcardUrl)).ToList();

                foreach (var breadcrumb in wildcardBreadcrumbItems)
                {
                    if (breadcrumb.Title == StaticData.WildcardItems.WildcardName)
                    {
                        breadcrumb.Title = eventName;
                    }

                    breadcrumb.ItemUrl = breadcrumb.ItemUrl.Replace(StaticData.WildcardItems.WildcardUrl, eventName);
                }

            }
        }

        private List<Item> GetBreadcrumbItems()
        {
            var homePath = Sitecore.Context.Site.StartPath;
            var homeItem = Sitecore.Context.Database.GetItem(homePath);
            var items = new List<Item> { homeItem };
            if (Sitecore.Context.Item.TemplateID.ToString() != StaticData.TemplateIds.EventDetailsTemplate)
            {
                items.AddRange(homeItem.Axes.GetDescendants()
                    .TakeWhile(i => i.ID != Sitecore.Context.Item.ID).ToList());
            }
            else
            {
                items.AddRange(homeItem.Axes.GetDescendants()
                    .TakeWhile(i => i.TemplateID != Sitecore.Context.Item.TemplateID).ToList());
            }

            return items;
        }
    }
}
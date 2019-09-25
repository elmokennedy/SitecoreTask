using System.Collections.Generic;
using System.Web.Mvc;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Links;
using Starter.Feature.Events.Models;
using Starter.Feature.Events.SitecoreData;

namespace Starter.Feature.Events.Controllers
{
    public class EventsController : Controller
    {
        public ActionResult EventsList()
        {
            var eventsRepository = Context.Database.GetItem(StaticData.ItemIds.EventsRepositoryId);

            var eventItems = eventsRepository.GetChildren();

            var eventList = new List<EventViewModel>();

            foreach (Item e in eventItems)
            {
                eventList.Add(new EventViewModel { EventName = e.Name, EventUrl = LinkManager.GetItemUrl(e) });
            }

            return View(eventList);
        }
    }
}
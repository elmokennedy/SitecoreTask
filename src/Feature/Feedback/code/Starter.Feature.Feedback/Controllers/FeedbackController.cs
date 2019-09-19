using System.Web.Mvc;
using Sitecore;
using Starter.Feature.Feedback.Models;

namespace Starter.Feature.Feedback.Controllers
{
    public class FeedbackController : Controller
    {
        [HttpGet]
        public ActionResult CreateFeedback()
        {
            return View();
        }

        [HttpPost]
        public ActionResult CreateFeedback(FeedbackEntity feedbackEntity)
        {
            if (!ModelState.IsValid)
            {
                return View(feedbackEntity);
            }
            
            feedbackEntity.ParentItem = Context.Item.Parent;
            return View("SuccessfulSubmission", feedbackEntity);
        }
    }
}
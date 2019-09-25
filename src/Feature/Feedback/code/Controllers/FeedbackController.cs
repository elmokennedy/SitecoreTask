using System.Linq;
using System.Web.Mvc;
using Sitecore;
using Sitecore.Data.Items;
using Starter.Feature.Feedback.Models;
using Starter.Feature.Feedback.SitecoreData;
using Starter.Foundation.DataProvider.MongoDb.Context;
using Starter.Foundation.DataProvider.MongoDb.Repositories;

namespace Starter.Feature.Feedback.Controllers
{
    public class FeedbackController : Controller
    {
        private const string SuccessfulSubmissionPage = "SuccessfulSubmission";

        private MongoContext mongoContext;
        private FeedbackRepository feedbackRepository;

        public FeedbackController()
        {
            mongoContext = new MongoContext();
            feedbackRepository = new FeedbackRepository(mongoContext.FeedbackCollection);
        }

        [HttpGet]
        public ActionResult CreateFeedback()
        {
            return View();
        }

        [HttpPost]
        public ActionResult CreateFeedback(FeedbackViewModel feedbackViewModel)
        {
            if (!ModelState.IsValid)
            {
                return View(feedbackViewModel);
            }

            feedbackViewModel.ParentItem = GetEventItem(Context.RawUrl);

            feedbackRepository.InsertFeedback(feedbackViewModel.FullName, feedbackViewModel.Feedback, feedbackViewModel.ParentItem.ID.ToString());

            return View(SuccessfulSubmissionPage, feedbackViewModel);
        }

        public ActionResult FeedbackList()
        {
            var eventItem = GetEventItem(Context.RawUrl);

            var feedbacks = feedbackRepository.GetFeedbacks(eventItem.ID.ToString());

            var feedbackViewModelList = feedbacks.Select(f => new FeedbackViewModel {FullName = f.Fullname, Feedback = f.FeedbackText}).ToList();

            return View(feedbackViewModelList);
        }

        private static Item GetEventItem(string url)
        {
            var urlSegments = url.Split('/');
            var eventName = urlSegments[urlSegments.Length - 2];
            return Context.Database.GetItem($"{StaticData.ItemPaths.EventsRepositoryPath}/{eventName}");
        }
    }
}
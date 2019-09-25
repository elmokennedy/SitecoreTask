using System.Collections.Generic;
using System.Linq;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Starter.Foundation.DataProvider.MongoDb.Entities;

namespace Starter.Foundation.DataProvider.MongoDb.Repositories
{
    public class FeedbackRepository
    {
        private MongoCollection<Feedback> _collection;

        public FeedbackRepository(MongoCollection<Feedback> collection)
        {
            _collection = collection;
        }

        public void InsertFeedback(string fullname, string feedbackText, string eventId)
        {
            _collection.Insert(new Feedback
            {
                Fullname = fullname,
                FeedbackText = feedbackText,
                EventId = eventId
            });
        }

        public IEnumerable<Feedback> GetFeedbacks(string eventId)
        {
            var feedbacks = _collection.AsQueryable().ToList();

            return feedbacks.Where(f => f.EventId == eventId);
        }
    }
}
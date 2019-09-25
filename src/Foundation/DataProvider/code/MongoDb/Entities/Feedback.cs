using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Starter.Foundation.DataProvider.MongoDb.Entities
{
    public class Feedback
    {
        [BsonId]
        public ObjectId _id { get; set; }

        [BsonElement("EventId")]
        public string EventId { get; set; }

        [BsonElement("FeedbackText")]
        public string FeedbackText { get; set; }

        [BsonElement("Fullname")]
        public string Fullname { get; set; }
    }
}
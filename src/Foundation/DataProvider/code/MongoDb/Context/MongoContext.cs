using System.Configuration;
using MongoDB.Driver;
using Starter.Foundation.DataProvider.MongoDb.Entities;

namespace Starter.Foundation.DataProvider.MongoDb.Context
{
    public class MongoContext
    {
        private const string ConnectionStringName = "MongoDb";
        private const string DatabaseName = "test";
        private const string CollectionName = "feedback";

        public MongoCollection<Feedback> FeedbackCollection { get; set; }

        public MongoContext()
        {
            var mongoClient = new MongoClient(ConfigurationManager.ConnectionStrings[ConnectionStringName].ConnectionString);

            var database = mongoClient.GetServer().GetDatabase(DatabaseName);

            FeedbackCollection = database.GetCollection<Feedback>(CollectionName);
        }
    }
}
using System.ComponentModel.DataAnnotations;
using Sitecore.Data.Items;
using Sitecore.Links;

namespace Starter.Feature.Feedback.Models
{
    public class FeedbackEntity
    {
        [Required]
        public string FullName { get; set; }

        [Required]
        public string Feedback { get; set; }

        public Item ParentItem { get; set; }

        public string ParentName => ParentItem.Name;

        public string ParentUrl => LinkManager.GetItemUrl(this.ParentItem);
    }
}
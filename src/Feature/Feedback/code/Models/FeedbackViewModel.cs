using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Sitecore.Data.Items;
using Sitecore.Links;

namespace Starter.Feature.Feedback.Models
{
    public class FeedbackViewModel
    {
        [Required]
        [DisplayName("Full name")]
        public string FullName { get; set; }

        [Required]
        [DisplayName("Feedback")]
        public string Feedback { get; set; }

        public Item ParentItem { get; set; }

        public string ParentName => ParentItem.Name;

        public string ParentUrl => LinkManager.GetItemUrl(this.ParentItem);
    }
}
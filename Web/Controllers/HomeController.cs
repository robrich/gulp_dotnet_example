using System.Web.Mvc;
using Lib;

namespace GulpTarget.Web.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            new Class1().DoIt("the thing");
            ViewBag.Message = "Modify this template to jump-start your ASP.NET MVC application.";

            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your app description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}

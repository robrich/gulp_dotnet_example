using Lib;
using NUnit.Framework;

namespace Tests
{
    [TestFixture]
    public class Class1_Tests
    {
        [Test]
        public void TheTest()
        {
            // Arrange
            const string expected = "thing done";
            const string source = "thing";

            // Act
            Class1 class1 = new Class1();
            var actual = class1.DoIt(source);

            // Assert
            Assert.That(actual, Is.EqualTo(expected));
        }
    }
}
